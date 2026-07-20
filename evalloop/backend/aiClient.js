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
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'openai/gpt-5.6';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 120000);
const DEFAULT_MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS || 1500);
const MIN_MAX_TOKENS = Number(process.env.OPENROUTER_MIN_MAX_TOKENS || 400);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isRotatable(error) {
  const status = error?.status || error?.response?.status;
  return status === 401 || status === 402 || status === 403 || status === 429;
}

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
          ? `${isGemini ? 'Gemini' : 'GPT-5.6'} key ${i + 1}/${keyPool.length} is out of credits. Add credits at openrouter.ai/settings/credits, add another key to the pool, or lower OPENROUTER_M[...]
          : `${isGemini ? 'Gemini' : 'GPT-5.6'} key ${i + 1}/${keyPool.length} failed: ${error.message}`;
        throw httpError(
          error.status && error.status < 500 ? error.status : 502,
          apiKey ? `Request failed with your provided key: ${error.message}` : friendly,
        );
      }
    }
  }
  throw lastError;
}
