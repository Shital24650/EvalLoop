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
