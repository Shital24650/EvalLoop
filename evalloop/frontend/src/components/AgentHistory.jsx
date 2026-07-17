export default function AgentHistory({ history, onLoad }) {
  return (
    <section className="history">
      <h3>Recent Sessions</h3>
      {history.length === 0 ? (
        <p className="hint">No saved sessions yet.</p>
      ) : (
        history.map((session, index) => (
          <div className="history-row" key={`${session.name}-${index}`}>
            <span>🤖 {session.name}</span>
            <b>
              {session.score}% {session.score >= 80 ? '✅' : session.score >= 60 ? '⚠️' : '❌'}
            </b>
            <time>{session.when}</time>
            <button onClick={() => onLoad(session.session)}>Load</button>
          </div>
        ))
      )}
    </section>
  );
}
