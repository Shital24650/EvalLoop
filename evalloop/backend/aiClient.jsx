import OpenAI from 'openai';

// ---- Key pools -------------------------------------------------------
// Keys live ONLY in environment variables (Vercel/Render/Railway/.env).
// Never commit real keys to the repo. Comma-separate multiple keys to
// enable automatic fallback when one key hits a quota/billing limit.
function parseKeyList(envValue) {
  return (envValue || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

const OPENAI_KEYS = parseKeyList(process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY);
const GEMINI_KEYS = parseKeyList(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY);

// GPT-5.6 is served through OpenRouter's OpenAI-compatible endpoint.
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'openai/gpt-5.6';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 120000);
// Cap tokens per request so a low-credit key doesn't 402 on the default
// (OpenRouter otherwise defaults to a high max_tokens some free/low-credit
// keys can't afford). Lower this further if you're on a very tight budget.
const DEFAULT_MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS || 1500);
const MIN_MAX_TOKENS = Number(process.env.OPENROUTER_MIN_MAX_TOKENS || 400);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Errors worth rotating to the next key for (quota/billing/auth) vs.
// errors that will happen again on every key (bad request, etc).
function isRotatable(error) {
  const status = error?.status || error?.response?.status;
  return status === 401 || status === 402 || status === 403 || status === 429;
}

// OpenRouter's 402 body looks like:
// "This request requires more credits, or fewer max_tokens. You requested
//  up to 2048 tokens, but can only afford 1335."
// Pull the affordable number out so we can retry once with a request that
// actually fits, instead of immediately burning/rotating the key.
function parseAffordableTokens(message) {
  const match = /can only afford (\d+)/i.exec(message || '');
  return match ? Number(match[1]) : null;
}

async function callOpenAiCompatible({ apiKey, baseURL, model, system, user, maxTokens }) {
  const client = new OpenAI({ apiKey, baseURL, timeout: REQUEST_TIMEOUT_MS });
  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return response.choices?.[0]?.message?.content;
  } catch (error) {
    const status = error?.status || error?.response?.status;
    if (status === 402) {
      const affordable = parseAffordableTokens(error.message);
      // Retry once, same key, with exactly what it can afford — cheaper
      // than rotating a whole key away for a small budget shortfall.
      if (affordable && affordable >= MIN_MAX_TOKENS && affordable < maxTokens) {
        const client2 = new OpenAI({ apiKey, baseURL, timeout: REQUEST_TIMEOUT_MS });
        const retryResponse = await client2.chat.completions.create({
          model,
          max_tokens: affordable,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        });
        return retryResponse.choices?.[0]?.message?.content;
      }
    }
    throw error;
  }
}

async function callGemini({ apiKey, model, system, user }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const error = new Error(`Gemini request failed (${res.status})`);
    error.status = res.status === 429 ? 429 : res.status;
    throw error;
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
}

/**
 * Ask a model for a JSON response, with automatic key rotation.
 * @param {object} opts
 * @param {'gpt-5.6'|'gemini'} opts.provider
 * @param {string} [opts.apiKey] - BYOK override; used once, never persisted.
 * @param {string} opts.system
 * @param {string} opts.user
 * @param {number} [opts.maxTokens] - overrides DEFAULT_MAX_TOKENS for this call
 */
export async function askProvider({ provider = 'gpt-5.6', apiKey, system, user, maxTokens }) {
  const isGemini = provider === 'gemini';
  const keyPool = apiKey ? [apiKey] : isGemini ? GEMINI_KEYS : OPENAI_KEYS;

  if (keyPool.length === 0) {
    throw httpError(
      503,
      isGemini
        ? 'No Gemini API key configured. Add GEMINI_API_KEYS on the server, or enter your own key.'
        : 'No GPT-5.6 API key configured. Add OPENAI_API_KEYS on the server, or enter your own key.',
    );
  }

  let lastError;
  for (let i = 0; i < keyPool.length; i += 1) {
    const key = keyPool[i];
    try {
      const raw = isGemini
        ? await callGemini({ apiKey: key, model: GEMINI_MODEL, system, user })
        : await callOpenAiCompatible({
            apiKey: key,
            baseURL: OPENROUTER_BASE_URL,
            model: OPENAI_MODEL,
            system,
            user,
            maxTokens: maxTokens || DEFAULT_MAX_TOKENS,
          });
      return { raw, provider, usedFallbackKeyIndex: i };
    } catch (error) {
      lastError = error;
      if (!isRotatable(error) || i === keyPool.length - 1) {
        const status = error?.status || error?.response?.status;
        const friendly = status === 402
          ? `${isGemini ? 'Gemini' : 'GPT-5.6'} key ${i + 1}/${keyPool.length} is out of credits. Add credits at openrouter.ai/settings/credits, add another key to the pool, or lower OPENROUTER_MAX_TOKENS.`
          : `${isGemini ? 'Gemini' : 'GPT-5.6'} key ${i + 1}/${keyPool.length} failed: ${error.message}`;
        throw httpError(
          error.status && error.status < 500 ? error.status : 502,
          apiKey ? `Request failed with your provided key: ${error.message}` : friendly,
        );
      }
      // else: quota/auth/credit error on this key -> try next key in the pool
    }
  }
  throw lastError;
}
