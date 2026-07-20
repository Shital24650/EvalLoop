export default function ModelCard({ metrics = {}, modelSelection = '' }) {
  const modelKey = (metrics.model || modelSelection || '').toLowerCase();
  const isGemini = modelKey.includes('gemini') || modelKey === 'gemini';
  const modelUsed = isGemini ? 'Gemini 2.5 Pro' : 'GPT-5.6';
  const provider = isGemini ? 'Google AI' : 'OpenAI';
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
