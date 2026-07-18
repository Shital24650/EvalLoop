const types = ['hallucination', 'prompt_misread', 'bad_tool_call', 'context_overflow', 'reasoning_loop'];

export default function FailureHeatmap({ failures = [], iterations = 1 }) {
  return (
    <section className="heatmap-card">
      <h3>FAILURE HEATMAP</h3>
      <div className="matrix" role="table" aria-label="Failure heatmap by iteration and type">
        <span />
        {types.map((type) => <b key={type}>{type.replace('_', ' ')}</b>)}
        {Array.from({ length: iterations }, (_, index) => index + 1).flatMap((iteration) => [
          <b key={`row-${iteration}`}>Iteration {iteration}</b>,
          ...types.map((type) => {
            const count = failures.filter((failure) => failure.failureType === type).length;
            const className = count === 0 ? 'pass' : count < 3 ? 'warn' : 'critical';
            return <i className={className} key={`${iteration}-${type}`} title={`${type}: ${count}`} />;
          }),
        ])}
      </div>
    </section>
  );
}
