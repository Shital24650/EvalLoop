const failureRows = [
  ['🌀', 'Hallucination', 'hallucination'],
  ['📖', 'Prompt Misread', 'prompt_misread'],
  ['🔧', 'Bad Tool Call', 'bad_tool_call'],
  ['💾', 'Context Overflow', 'context_overflow'],
  ['🔁', 'Reasoning Loop', 'reasoning_loop'],
];

export default function FailureDNA({ failures }) {
  const totalFailures = failures.length || 1;

  return (
    <article className="card stagger">
      <h3>FAILURE DNA</h3>
      <p>What broke your agent</p>
      {failureRows.map(([emoji, label, key]) => {
        const failureCount = failures.filter((failure) => failure.failureType === key).length;
        const percent = Math.round((failureCount / totalFailures) * 100);

        return (
          <div className="dna" key={key}>
            <span>
              {emoji} {label}
            </span>
            <div>
              <i style={{ width: `${percent}%` }} />
            </div>
            <b>{percent}%</b>
          </div>
        );
      })}
    </article>
  );
}
