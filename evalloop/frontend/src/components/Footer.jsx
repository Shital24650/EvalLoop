export default function Footer() {
  return (
    <footer className="footer polished-footer" role="contentinfo">
      <div className="footer-left">
        <div className="brand">EvalLoop v1.0</div>
        <div className="sub muted">Powered by GPT-5.6 + Codex • Supports Gemini • OpenAI Build Week 2026</div>
      </div>
      <div className="footer-right">
        <a className="link" href="https://github.com/Shital24650/EvalLoop" target="_blank" rel="noreferrer">GitHub</a>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>Documentation</a>
        <a className="link" href="#" onClick={(e) => e.preventDefault()}>Report Issue</a>
      </div>
    </footer>
  );
}
