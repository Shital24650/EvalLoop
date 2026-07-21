export default function LandingPage() {
  return (
    <section className="landing">
      <div>
        <p className="eyebrow">AI Developer Tools Hackathon Edition</p>

        <div className="hero-metrics">
          <div className="metric-card">
            <strong>10+</strong>
            <span>🤖 Evaluation Scenarios</span>
          </div>

          <div className="metric-card">
            <strong>90%</strong>
            <span>📈 Reliability After Fixes</span>
          </div>

          <div className="metric-card">
            <strong>20</strong>
            <span>🛡️ Built-in Security Tests</span>
          </div>

          <div className="metric-card">
            <strong>GPT-5.6 + Groq</strong>
            <span>⚡ Multi-Model Support</span>
          </div>
        </div>

        <h1>EvalLoop — Trust Your AI Agent Before Production</h1>

        <p>
          Automatically evaluate AI agents for reliability, prompt security,
          jailbreak resistance, hallucinations, tool misuse, and prompt
          quality before deployment.
        </p>

        <div className="landing-actions">
          <a
            href="https://github.com/Shital24650/EvalLoop"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>

          <a
            href="https://agenttrust-benchmark.ai.studio/"
            target="_blank"
            rel="noreferrer"
          >
            AgentTrust Demo
          </a>
        </div>
      </div>

      <div className="pipeline">
        <span>Generate</span>
        <span>Batch Evaluate</span>
        <span>Rewrite</span>
        <span>Security Scan</span>
        <span>Export</span>
      </div>
    </section>
  );
}
