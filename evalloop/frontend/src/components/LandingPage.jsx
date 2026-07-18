export default function LandingPage() {
  return (
    <section className="landing">
      <div>
        <p className="eyebrow">AI Developer Tools Hackathon Edition</p>
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
