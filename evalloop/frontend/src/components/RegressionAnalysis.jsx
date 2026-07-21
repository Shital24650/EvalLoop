export default function RegressionAnalysis({ current, history }) {
  if (!current) return null;

  const previous = history.find((item) => item.session !== current)?.session;
  if (!previous) return null;

  const oldFailures = new Set(
    (previous.failures || []).map(
      (failure) => `${failure.testId}:${failure.failureType}`
    )
  );

  const newFailures = (current.failures || []).filter(
    (failure) => !oldFailures.has(`${failure.testId}:${failure.failureType}`)
  );

  const fixedFailures = (previous.failures || []).filter(
    (failure) =>
      !(current.failures || []).some(
        (currentFailure) =>
          currentFailure.testId === failure.testId &&
          currentFailure.failureType === failure.failureType
      )
  );

  const oldScore =
    current.regression?.oldScore ??
    previous.metrics?.reliabilityScore ??
    previous.after;

  const newScore =
    current.regression?.newScore ??
    current.metrics?.reliabilityScore ??
    current.after;

  const regression =
    current.regression?.improvement ??
    (newScore - oldScore);

  return (
    <section className="regression">
      <h3>REGRESSION ANALYSIS</h3>

      <div className="regression-grid">
        <div>
          Old Score <b>{oldScore}%</b>
        </div>

        <div>
          New Score <b>{newScore}%</b>
        </div>

        <div>
          Regression{" "}
          <b>
            {regression >= 0 ? "+" : ""}
            {regression}%
          </b>
        </div>

        <div>
          New Failures <b>{newFailures.length}</b>
        </div>

        <div>
          Fixed Failures <b>{fixedFailures.length}</b>
        </div>
      </div>

      <div className="trend" aria-label="Reliability trend">
        {history
          .slice(0, 5)
          .reverse()
          .map((item, index) => (
            <i
              key={`${item.name}-${index}`}
              style={{ height: `${Math.max(8, item.score)}%` }}
              title={`${item.name}: ${item.score}%`}
            />
          ))}
      </div>
    </section>
  );
}
