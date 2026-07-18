import DeveloperDashboard from './DeveloperDashboard.jsx';
import FailureDNA from './FailureDNA.jsx';
import InjectionScanner from './InjectionScanner.jsx';
import PromptDiff from './PromptDiff.jsx';
import ReliabilityScore from './ReliabilityScore.jsx';
import RewriteExplanation from './RewriteExplanation.jsx';
import SeverityBreakdown from './SeverityBreakdown.jsx';

export default function ResultsDashboard({ results }) {
  return (
    <section className="results slide">
      <div className="dash-grid">
        <ReliabilityScore results={results} />
        <FailureDNA failures={results.failures} />
        <PromptDiff changes={results.changes} />
        <RewriteExplanation changes={results.changes} />
      </div>
      <DeveloperDashboard results={results} />
      <InjectionScanner agentPrompt={results.originalPrompt} agentType={results.agentType} />
      <SeverityBreakdown results={results} />
    </section>
  );
}
