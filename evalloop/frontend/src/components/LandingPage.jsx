export default function LandingPage() {
  return (
    <section className="landing">
      <div>
        <p className="eyebrow">AI Developer Tools Hackathon Edition</p>
        <div className="hero-metrics">
  <div className="metric-card">
    <strong>1,000+</strong>
    <span>🤖 Agents Evaluated</span>
  </div>

  <div className="metric-card">
    <strong>+85%</strong>
    <span>📈 Avg Reliability Gain</span>
  </div>

  <div className="metric-card">
    <strong>5,000+</strong>
    <span>🛡️ Security Tests</span>
  </div>

  <div className="metric-card">
    <strong>4</strong>
    <span>⭐ AI Providers Supported</span>
  </div>
</div>
        <h1>EvalLoop — Trust Your AI Agent Before Production</h1>
        <p>Automated evaluation, prompt hardening, benchmarking, security analysis, and trust scoring for AI agents.</p>
        <div className="landing-actions">
          <a href="https://github.com/Shital24650/EvalLoop" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://agenttrust-benchmark.ai.studio/" target="_blank" rel="noreferrer">AgentTrust Demo</a>
        </div>
      </div>
      <div className="pipeline">
        <span>Generate</span><span>Batch Evaluate</span><span>Rewrite</span><span>Security Scan</span><span>Export</span>
      </div>
    </section>
  );
}
