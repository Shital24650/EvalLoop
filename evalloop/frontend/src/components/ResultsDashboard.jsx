import FailureHeatmap from './FailureHeatmap.jsx';
import LatencyDashboard from './LatencyDashboard.jsx';
import SecurityRadar from './SecurityRadar.jsx';
import TrustBadge from './TrustBadge.jsx';
import TrustGauge from './TrustGauge.jsx';
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
      <div className="wow-grid">
        <TrustGauge score={results.metrics?.agentTrustScore ?? results.after} />
        <SecurityRadar metrics={results.metrics} />
      </div>
      <DeveloperDashboard results={results} />
      <div className="wow-grid">
        <FailureHeatmap failures={results.failures} iterations={results.iterations} />
        <LatencyDashboard metrics={results.metrics} />
      </div>
      <TrustBadge score={results.metrics?.agentTrustScore ?? results.after} />
      <InjectionScanner agentPrompt={results.originalPrompt} agentType={results.agentType} />
      <SeverityBreakdown results={results} />
    </section>
  );
}
