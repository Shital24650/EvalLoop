const links = [
  ['GitHub', 'https://github.com/Shital24650/EvalLoop'],
  ['AgentTrust Demo', 'https://agenttrust-benchmark.ai.studio/'],
  ['Documentation', 'https://github.com/Shital24650/EvalLoop#readme'],
  ['Report Issue', 'https://github.com/Shital24650/EvalLoop/issues/new/choose'],
];

export default function Header() {
  return (
    <header className="header">
      <div>
        <div className="logo">⚡ EvalLoop</div>
        <div className="tagline">Autonomous Agent Reliability Engine</div>
        <div className="subtitle">Powered by GPT-5.6 + Codex</div>
      </div>
      <nav aria-label="Primary navigation">
        {links.map(([label, href]) => (
          <a href={href} key={href} target="_blank" rel="noreferrer">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
