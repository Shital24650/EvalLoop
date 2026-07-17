const agentTypes = [
  ['🤖', 'Customer Support'],
  ['📝', 'Code Review'],
  ['🔍', 'RAG / Search'],
  ['📊', 'Data Analysis'],
  ['🛠️', 'Tool-Use Agent'],
  ['✍️', 'Content Generation'],
];

export default function AgentTypeSelector({ selected, onSelect }) {
  return (
    <section>
      <h2>What kind of agent are you testing?</h2>
      <div className="type-grid">
        {agentTypes.map(([icon, label]) => (
          <button
            className={`type-card ${selected === label ? 'selected' : ''}`}
            key={label}
            onClick={() => onSelect(label)}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
