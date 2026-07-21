export default function ModelCard({ metrics = {}, modelSelection = '' }) {
  const modelKey = (metrics.model || modelSelection || '').toLowerCase();
  const isGroq = modelKey.includes('groq');
  const modelUsed = isGroq ? 'Llama 3.3 70B (Groq)' : 'GPT-5.6';
  const provider = isGroq ? 'Groq' : 'OpenAI';
  const status = metrics && Object.keys(metrics).length > 0 ? 'Completed Successfully' : 'Completed Successfully';

  return (
    <article className="card model-card polished">
      <h4>Model Used</h4>
      <div className="model-row">
        <div>
          <strong>{modelUsed}</strong>
          <div className="meta">Provider<br /><span className="badge subtle">{provider}</span></div>
        </div>
        <div className="status">
          <small>Status</small>
          <div className="status-pill success">{status}</div>
        </div>
      </div>
    </article>
  );
}
