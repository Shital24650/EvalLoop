const severityConfig = {
  critical: {
    icon: '🔴',
    title: 'CRITICAL — Fix before any deployment',
  },
  medium: {
    icon: '🟡',
    title: 'MEDIUM — Fix before public launch',
  },
  low: {
    icon: '🟢',
    title: 'LOW — Optional improvement',
  },
};

const failureLabels = {
  hallucination: 'Hallucination',
  prompt_misread: 'Prompt Misread',
  bad_tool_call: 'Bad Tool Call',
  context_overflow: 'Context Overflow',
  reasoning_loop: 'Reasoning Loop',
};

function groupFailuresBySeverity(failures) {
  return failures.reduce(
    (groups, failure) => {
      const severity = severityConfig[failure.severity] ? failure.severity : 'low';
      groups[severity].push(failure);
      return groups;
    },
    { critical: [], medium: [], low: [] },
  );
}

function countFailureTypes(failures) {
  return failures.reduce((counts, failure) => {
    const label = failureLabels[failure.failureType] || 'Unknown Failure';
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});
}

export default function SeverityBreakdown({ results }) {
  const groupedFailures = groupFailuresBySeverity(results.failures || []);

  return (
    <section className="severity">
      <h3>SEVERITY BREAKDOWN</h3>
      <p>Based on: {results.agentType} Agent</p>
      {Object.entries(severityConfig).map(([severity, config]) => {
        const failures = groupedFailures[severity];
        const testIds = failures.map((failure) => failure.testId).join(', ');
        const typeCounts = countFailureTypes(failures);

        return (
          <div key={severity}>
            {config.icon} <b>{config.title}</b>
            <br />
            Failures found: {failures.length}
            <br />
            Found in Tests: {testIds || 'None'}
            <br />
            Failure Types:{' '}
            {Object.keys(typeCounts).length
              ? Object.entries(typeCounts)
                  .map(([type, count]) => `${type} (${count})`)
                  .join(', ')
              : 'None'}
            {failures.map((failure) => (
              <p className="severity-evidence" key={`${severity}-${failure.testId}`}>
                Test {failure.testId}: {failure.evidence || 'No evidence provided.'}
              </p>
            ))}
          </div>
        );
      })}
    </section>
  );
}
