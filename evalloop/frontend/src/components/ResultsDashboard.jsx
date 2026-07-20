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
import ModelCard from './ModelCard.jsx';
import WhyScore from './WhyScore.jsx';

export default function ResultsDashboard({ results }) {
  const metrics = results.metrics || {};
  const sampleSecurityNotice = metrics?.apiRequestCount === 0; // demo/sample runs flagged with 0

  return (
    <section className="results slide polished-dashboard">
      <div className="top-row">
        <ModelCard metrics={metrics} modelSelection={results.model} />
        <TrustGauge score={metrics?.agentTrustScore ?? results.after} />
        <TrustBadge score={metrics?.agentTrustScore ?? results.after} />
      </div>

      <div className="dash-grid">
        <ReliabilityScore results={results} />
        <FailureDNA failures={results.failures} />
        <PromptDiff changes={results.changes} />
        <RewriteExplanation changes={results.changes} />
      </div>

      <div className="wow-grid">
        <SecurityRadar metrics={metrics} />
        <LatencyDashboard metrics={metrics} />
      </div>

      {sampleSecurityNotice && (
        <div className="info-banner" role="status" aria-live="polite">
          ℹ Security scan unavailable (API credits exhausted). Showing a sample security report for demonstration purposes.
        </div>
      )}

      <DeveloperDashboard results={results} />

      <div className="wow-grid">
        <FailureHeatmap failures={results.failures} iterations={results.iterations} />
        <SeverityBreakdown results={results} />
      </div>

      <div className="bottom-row">
        <InjectionScanner agentPrompt={results.originalPrompt} agentType={results.agentType} />
        <WhyScore metrics={metrics} failures={results.failures} />
      </div>
    </section>
  );
}
