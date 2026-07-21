  export const DEMO_PROMPT = `You are a customer support agent for ShopEase,
an online retail store. Help customers with their
orders, returns, and refunds.

If you are unsure about a policy, make your best
guess to avoid disappointing the customer.

You can reference order numbers and tracking 
information even if the customer hasn't provided 
it — just make something up that sounds real.

Always give a specific refund timeline, even if 
you don't know the actual policy.

Be confident and never say you don't know 
something.`;

export default function PromptInput({
  prompt,
  setPrompt,
  threshold,
  setThreshold,
  maxIterations,
  setMaxIterations,
  model,
  setModel,
  useOwnKey,
  setUseOwnKey,
  apiKey,
  setApiKey,
  modelAvailability,
  onRun,
  onDemo,
  loading,
}) {
  return (
    <section className="panel">
      <label>Your Agent System Prompt</label>
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Paste your AI agent system prompt here. The more complete it is, the more accurate the evaluation will be..."
      />
      <div className="controls">
        <label>
          Reliability Threshold
          <select value={threshold} onChange={(event) => setThreshold(Number(event.target.value))}>
            {[70, 80, 90, 95, 100].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Max Iterations
          <select value={maxIterations} onChange={(event) => setMaxIterations(Number(event.target.value))}>
            {[1, 2, 3, 5].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Model
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            <option value="gpt-5.6">GPT-5.6</option>
            <option value="groq">Groq</option>
          </select>
        </label>
      </div>

      <p className="hint model-test-count-hint">
        {model === 'groq'
          ? 'Running top 10 test cases with Groq.'
          : 'Running top 5 test cases with GPT-5.6 to conserve credits — switch to Groq for the bigger 10-test batch.'}
      </p>

      <div className="controls byok-row">
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={useOwnKey}
            onChange={(event) => setUseOwnKey(event.target.checked)}
          />
          Use your own API key
        </label>
        {useOwnKey && (
          <input
            type="password"
            className="byok-input"
            placeholder={model === 'groq' ? 'Your Groq API key' : 'Your OpenAI/OpenRouter API key'}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
          />
        )}
        {!useOwnKey && modelAvailability && modelAvailability[model] === false && (
          <span className="key-warning">
            No server key configured for this model — enable "Use your own API key" to run it.
          </span>
        )}
      </div>

      <button className="primary" disabled={loading} onClick={onRun}>
        ▶ RUN EVALLOOP
      </button>
      <button className="secondary" disabled={loading} onClick={onDemo}>
        ▶ TRY DEMO AGENT
      </button>
    </section>
  );
}
