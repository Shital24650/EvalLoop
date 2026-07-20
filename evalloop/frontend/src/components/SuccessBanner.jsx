export default function SuccessBanner() {
  return (
    <div className="success-banner polished" role="status" aria-live="polite">
      <div className="success-left">
        <div className="emoji">✅</div>
        <div>
          <strong>Evaluation Complete</strong>
          <div className="muted">Reliability analysis finished successfully. Trust report generated. Prompt improvements available.</div>
        </div>
      </div>
    </div>
  );
}
