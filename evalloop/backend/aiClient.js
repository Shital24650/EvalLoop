/* evalloop/backend/aiClient.js
   Reworked: safer retries/backoff, Gemini fallbacks, response_format fallback,
   empty/blocked output detection, masked logging, request dedupe, and timeouts.
*/
import OpenAI from 'openai';

function parseKeyList(envValue) {
  return (envValue || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

const OPENAI_KEYS = parseKeyList(process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY);
const GEMINI_KEYS = parseKeyList(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY);

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-terra';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// A small ordered fallback list for Gemini models to try if one is not found.
const GEMINI_FALLBACK_MODELS = [
  GEMINI_MODEL,
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',

];

const REQUEST_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 120000);
const DEFAULT_MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS || 2500);
const MIN_MAX_TOKENS = Number(process.env.OPENROUTER_MIN_MAX_TOKENS || 400);

const MAX_RETRY_ATTEMPTS = Number(process.env.AI_CLIENT_MAX_RETRIES || 4);
const BACKOFF_BASE_MS = Number(process.env.AI_CLIENT_BACKOFF_BASE_MS || 250);
const MAX_BACKOFF_MS = Number(process.env.AI_CLIENT_MAX_BACKOFF_MS || 10000);

// Guard: maximum prompt length to avoid accidental DoS via huge inputs (characters).
const MAX_PROMPT_CHARS = Number(process.env.MAX_PROMPT_CHARS || 60_000);

// In-flight dedupe to avoid duplicate requests for the same provider + payload.
const inFlightRequests = new Map();

function httpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  if (details) error.details = details;
  return error;
}

function maskForLog(value) {
  if (!value) return value;
  if (typeof value !== 'string') return value;
  if (value.length <= 8) return '****';
  return value.slice(0, 4) + '...' + value.slice(-4);
}

function isTransientStatus(status) {
  return [429, 500, 502, 503, 504].includes(Number(status));
}

function isRotatable(error) {
  const status = error?.status || error?.response?.status;
  // Rotatable: auth/quota/credit problems where trying another key is logical.
  return status === 401 || status === 402 || status === 403 || status === 429;
}

function parseAffordableTokens(message) {
  const match = /can only afford (\d+)/i.exec(message || '');
  return match ? Number(match[1]) : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, shouldRetry, maxAttempts = MAX_RETRY_ATTEMPTS) {
  let attempt = 0;
  let lastErr;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      attempt += 1;
      const status = err?.status || err?.response?.status;
      if (!shouldRetry(err) || attempt >= maxAttempts) break;
      // exponential backoff with jitter
      const base = Math.min(MAX_BACKOFF_MS, BACKOFF_BASE_MS * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * Math.min(500, base));
      const delay = Math.min(MAX_BACKOFF_MS, base + jitter);
      // server-side log for diagnostics (mask any keys present)
      try {
        console.warn(`[aiClient] transient error (attempt ${attempt}/${maxAttempts}) status=${maskForLog(String(status))} message=${maskForLog(err.message)}`);
      } catch (e) { /* ignore logging errors */ }
      await sleep(delay);
    }
  }
  throw lastErr || new Error('Unknown error in retryWithBackoff');
}

function ensurePromptSafe(text) {
  if (typeof text !== 'string') return '';
  // Trim and cap length
  let t = text.trim();
  if (t.length > MAX_PROMPT_CHARS) {
    t = t.slice(0, MAX_PROMPT_CHARS);
  }
  // Basic sanitization: remove unexpected control characters
  return t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');
}

async function callOpenAiCompatible({ apiKey, baseURL, model, system, user, maxTokens }) {
  // Use the official SDK where possible. We'll try to use response_format
  // but fall back gracefully if provider doesn't support it.
  const client = new OpenAI({ apiKey, baseURL, timeout: REQUEST_TIMEOUT_MS });

  const messages = [
    { role: 'system', content: ensurePromptSafe(system) },
    { role: 'user', content: ensurePromptSafe(user) },
  ];

  const effectiveMaxTokens = Math.max(MIN_MAX_TOKENS, maxTokens || DEFAULT_MAX_TOKENS);

  // First try: use response_format (preferred for structured JSON)
  try {
     const response = await client.chat.completions.create({
  model,
  messages,
  temperature: 0,
  max_tokens: effectiveMaxTokens,
  response_format: { type: "json_object" },
});
    return response.choices?.[0]?.message?.content;
  } catch (err) {
    const status = err?.status || err?.response?.status;
    const message = String(err?.message || (err?.response && JSON.stringify(err.response)) || err);
    // If response_format is unsupported (some endpoints), fall back to plain chat content
    if (message.toLowerCase().includes('response_format') || message.toLowerCase().includes('unsupported') || status === 400 || status === 422) {
      // second attempt: ask for JSON string in plain content (explicit instruction)
      try {
        const fallbackMessages = [
          { role: 'system', content: ensurePromptSafe(system) },
          { role: 'user', content: ensurePromptSafe(user) + '\n\nReturn ONLY valid JSON (no prose).'},
        ];
        const response = await client.chat.completions.create({
  model,
  max_tokens: effectiveMaxTokens,
  temperature: 0,
  messages: fallbackMessages,
});
        return response.choices?.[0]?.message?.content;
      } catch (err2) {
        // bubble up the original or the new error as appropriate
        err2.original = err;
        throw err2;
      }
    }
    // For 402 affordable token suggestions, try a single retry with smaller max_tokens if feasible
    if (status === 402) {
      const affordable = parseAffordableTokens(message);
      if (affordable && affordable >= MIN_MAX_TOKENS && affordable < effectiveMaxTokens) {
        const client2 = new OpenAI({ apiKey, baseURL, timeout: REQUEST_TIMEOUT_MS });
        try {
          const retryResponse = await client2.chat.completions.create({
  model,
  max_tokens: affordable,
  temperature: 0,
  messages,
});
          return retryResponse.choices?.[0]?.message?.content;
        } catch (err3) {
          // continue to throw original
        }
      }
    }
    throw err;
  }
}

async function callGeminiSingle({ apiKey, model, system, user }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
  contents: [
    {
      role: "user",
      parts: [
        {
          text: `${ensurePromptSafe(system)}\n\n${ensurePromptSafe(user)}`
        }
      ]
    }
  ]
};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
  const body = await res.text();

  console.log("Gemini URL:", url);
  console.log("Gemini Error:", res.status, body);

  const err = new Error(body);
  err.status = res.status;
  err.body = body;
  throw err;
}
    const data = await res.json();
    // Check for blocked/empty candidates
    const candidate = data?.candidates?.[0];
    if (!candidate || !Array.isArray(candidate?.content?.parts) || candidate.content.parts.length === 0) {
      const err = new Error('Gemini returned no usable output (empty or blocked).');
      err.status = 502;
      err.details = { model, hasCandidates: Boolean(data?.candidates?.length) };
      throw err;
    }
    const joined = candidate.content.parts.map((p) => p.text || '').join('');
    if (!joined.trim()) {
      const err = new Error('Gemini returned an empty response.');
      err.status = 502;
      throw err;
    }
    return joined;
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini({ apiKey, model, system, user }) {
  // Try the preferred model and then fallbacks if we get 404/unsupported.
  const modelsToTry = GEMINI_FALLBACK_MODELS.slice();
  // Put explicit model first if provided
  if (model && !modelsToTry.includes(model)) {
    modelsToTry.unshift(model);
  }
  let lastErr;
  for (let m of modelsToTry) {
    try {
      return await retryWithBackoff(
        () => callGeminiSingle({ apiKey: apiKey, model: m, system, user }),
        (err) => isTransientStatus(err?.status) || (err?.status === 404) // retry on transient and try next on 404
      );
    } catch (err) {
      lastErr = err;
      if (err?.status === 404) {
        // model not found — try next
        continue;
      }
      // If rotatable, bubble up as rotatable so caller can rotate key
      if (!isTransientStatus(err?.status)) {
        // non-transient fatal
        break;
      }
      // otherwise try next fallback model if any
    }
  }
  // If lastErr indicates model not found, give a friendly message.
  if (lastErr?.status === 404) {
    throw httpError(502, `Gemini model not found. Tried models: ${modelsToTry.join(', ')}. Check GEMINI_MODEL or update your key/permissions.`, { triedModels: modelsToTry });
  }
  throw lastErr || new Error('Unknown error calling Gemini');
}

/**
 * Ask a provider for a JSON response with robust handling, key rotation,
 * retries, backoff, fallbacks and helpful errors.
 */
export async function askProvider({ provider = 'gpt-5.6', apiKey, system, user, maxTokens }) {
  const isGemini = provider === 'gemini';
  const keyPool = apiKey ? [apiKey] : isGemini ? GEMINI_KEYS : OPENAI_KEYS;

  if (!system || !user) throw httpError(400, 'Missing system or user prompt.');
  system = ensurePromptSafe(system);
  user = ensurePromptSafe(user);

  if (user.length > MAX_PROMPT_CHARS || system.length > MAX_PROMPT_CHARS) {
    throw httpError(413, `Prompt too large. Limit is ${MAX_PROMPT_CHARS} characters.`);
  }

  if (!Array.isArray(keyPool) || keyPool.length === 0) {
    throw httpError(503, isGemini ? 'No Gemini API key configured' : 'No GPT-5.6 API key configured');
  }

  const requestSignature = `${provider}:${system.slice(0,200)}:${user.slice(0,200)}:${String(maxTokens || '')}`;
  // If identical request already in flight, await the same promise
  if (inFlightRequests.has(requestSignature)) {
    try {
      const existing = await inFlightRequests.get(requestSignature);
      return existing;
    } catch (e) {
      // fall through to re-try
    }
  }

  const callPromise = (async () => {
    let lastError;
    for (let i = 0; i < keyPool.length; i += 1) {
      const key = keyPool[i];
      try {
        if (isGemini) {
          const raw = await callGemini({ apiKey: key, model: process.env.GEMINI_MODEL, system, user });
          return { raw, provider: 'gemini', usedFallbackKeyIndex: i };
        } else {
          // Use backoff around OpenAI/OpenRouter calls (these can produce transient errors)
          // Treat keys that start with 'sk-or-' as OpenRouter keys; otherwise 'sk-' implies OpenAI
          const isOfficialOpenAiKey = key && typeof key === 'string' && key.startsWith('sk-') && !key.startsWith('sk-or-');
          const raw = await retryWithBackoff(
  () =>
    callOpenAiCompatible({
      apiKey: key,
      baseURL: isOfficialOpenAiKey ? undefined : OPENROUTER_BASE_URL,
      model: OPENAI_MODEL,
      system,
      user,
      maxTokens,
    }),
  (err) => {
    const status = err?.status || err?.response?.status;
    return isTransientStatus(status) || isRotatable(err);
  }
);

return {
  raw,
  provider: 'gpt-5.6',
  usedFallbackKeyIndex: i,
};
          }
        }catch (error) {
        lastError = error;
        // If this error suggests rotating keys (auth/429/402) try next key; otherwise fail if last.
        if (!isRotatable(error) || i === keyPool.length - 1) {
          const status = error?.status || error?.response?.status;
          let friendly;
          if (status === 402) {
            friendly = `${isGemini ? 'Gemini' : 'GPT-5.6'} key ${i + 1}/${keyPool.length} is out of credits. Add credits at openrouter.ai/settings/credits, add another key to the pool, or lower O[...]`;
          } else {
            friendly = `${isGemini ? 'Gemini' : 'GPT-5.6'} key ${i + 1}/${keyPool.length} failed: ${error.message}`;
          }
          const displayMessage = apiKey ? `Request failed with provided key: ${error.message}` : friendly;
          // Log details server-side (mask)
          try {
            console.error('[aiClient] Final error (masked):', {
              provider,
              usedKeyIndex: i,
              errorMessage: maskForLog(String(error.message)),
              status,
              details: error?.details ? { ...error.details } : undefined,
            });
          } catch (e) { /* ignore logging errors */ }
          throw httpError(status && status < 500 ? status : 502, displayMessage);
        }
        // else try next key in pool after brief jittered backoff handled by retryWithBackoff above
      }
    }
    // If we exhausted keys
    throw lastError || new Error('No response from provider');
  })();

  inFlightRequests.set(requestSignature, callPromise);
  try {
    const result = await callPromise;
    return result;
  } finally {
    inFlightRequests.delete(requestSignature);
  }
}
