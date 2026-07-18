import { useState } from 'react';
import { jsPDF } from 'jspdf';

const failureLabels = {
  hallucination: 'Hallucination',
  prompt_misread: 'Prompt Misread',
  bad_tool_call: 'Bad Tool Call',
  context_overflow: 'Context Overflow',
  reasoning_loop: 'Reasoning Loop',
};


function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildMarkdownReport(results) {
  const metrics = results.metrics || {};
  return `# EvalLoop Report

## Executive Summary

- Agent Type: ${results.agentType}
- Timestamp: ${metrics.generatedAt || new Date().toISOString()}
- Model: ${metrics.model || 'gpt-5.6'}
- Reliability: ${results.before}% → ${results.after}%
- Agent Trust Score: ${metrics.agentTrustScore ?? results.after}
- Confidence Score: ${metrics.confidenceScore ?? 'n/a'}
- Risk Score: ${metrics.riskScore ?? 'n/a'}
- Latency: ${metrics.latencyMs ?? 'n/a'}ms
- API Calls: ${metrics.apiRequestCount ?? 'n/a'}
- Estimated Tokens: ${metrics.estimatedTokenUsage?.total ?? 'n/a'}
- Estimated Cost: $${metrics.estimatedApiCostUsd ?? '0.0000'}
- Failures: ${results.failures.length}

## Recommendations

${results.changes?.map((change) => `- ${change.reason}`).join('\n') || '- No rewrite recommendations recorded.'}

## Security Findings

${results.securityFindings?.map((finding) => `- ${finding.attackType} (${finding.severity}): ${finding.suggestedFix}`).join('\n') || '- No lightweight prompt security findings detected.'}

## Failed Tests
${results.failures
    .map((failure) => `- Test ${failure.testId}: ${failure.failureType} (${failure.severity}) — ${failure.evidence}`)
    .join('\n')}

## Fixed Prompt

${results.fixedPrompt}
`;
}

function buildHtmlReport(results) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>EvalLoop Report</title></head><body><pre>${buildMarkdownReport(
    results,
  ).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])}</pre></body></html>`;
}

function buildSarifReport(results) {
  return {
    version: '2.1.0',
    runs: [
      {
        tool: { driver: { name: 'EvalLoop', informationUri: 'https://github.com/shitalparab/agenttrust' } },
        results: results.failures.map((failure) => ({
          ruleId: failure.failureType || 'unknown_failure',
          level: failure.severity === 'critical' ? 'error' : failure.severity === 'medium' ? 'warning' : 'note',
          message: { text: failure.evidence || 'Failure evidence unavailable.' },
          properties: { testId: failure.testId },
        })),
      },
    ],
  };
}

function buildJUnitReport(results) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="EvalLoop" tests="20" failures="${results.failures.length}">
${results.failures
    .map(
      (failure) =>
        `  <testcase name="Test ${failure.testId} ${failure.failureType}"><failure message="${failure.severity}">${String(
          failure.evidence || '',
        ).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])}</failure></testcase>`,
    )
    .join('\n')}
</testsuite>`;
}

function buildFailureBreakdown(failures) {
  const total = failures.length || 1;

  return Object.entries(failureLabels).map(([key, label]) => {
    const count = failures.filter((failure) => failure.failureType === key).length;
    const percent = Math.round((count / total) * 100);

    return { key, label, count, percent };
  });
}

function buildShareSummary(results) {
  const failureCount = results.failures?.length || 0;
  const fixedPromptPreview = `${results.fixedPrompt.slice(0, 100)}${
    results.fixedPrompt.length > 100 ? '...' : ''
  }`;

  return `EvalLoop Report — ${results.agentType} Agent
Reliability: ${results.before}% → ${results.after}%
Failures found: ${failureCount}
Fixed prompt: ${fixedPromptPreview}`;
}

function exportPdf(results) {
  const doc = new jsPDF();
  const failures = results.failures || [];
  const dna = buildFailureBreakdown(failures);
  const margin = 14;
  const pageHeight = doc.internal.pageSize.height;
  let y = 18;

  const addLine = (text, options = {}) => {
    const fontSize = options.fontSize || 10;
    const lineHeight = options.lineHeight || fontSize * 0.5 + 4;

    doc.setFontSize(fontSize);
    doc.setFont(undefined, options.bold ? 'bold' : 'normal');

    const lines = doc.splitTextToSize(text, 180);
    lines.forEach((line) => {
      if (y > pageHeight - 18) {
        doc.addPage();
        y = 18;
      }

      doc.text(line, margin, y);
      y += lineHeight;
    });
  };

  addLine('⚡ EvalLoop Report', { fontSize: 18, bold: true, lineHeight: 10 });
  addLine('Autonomous Agent Reliability Engine', { fontSize: 11, lineHeight: 8 });
  y += 4;
  addLine(`Agent type: ${results.agentType} Agent`, { bold: true });
  addLine(`Reliability: ${results.before}% → ${results.after}%`, { bold: true });
  y += 4;

  addLine('Failure DNA Breakdown', { fontSize: 13, bold: true, lineHeight: 8 });
  dna.forEach((item) => {
    addLine(`${item.label}: ${item.count} failures (${item.percent}%)`);
  });
  y += 4;

  addLine('Failed Tests with Evidence', { fontSize: 13, bold: true, lineHeight: 8 });
  if (failures.length === 0) {
    addLine('No failed tests recorded.');
  } else {
    failures.forEach((failure) => {
      addLine(
        `Test ${failure.testId}: ${failureLabels[failure.failureType] || 'Unknown'} — ${
          failure.severity || 'unknown'
        }`,
        { bold: true },
      );
      addLine(`Evidence: ${failure.evidence || 'No evidence provided.'}`);
    });
  }
  y += 4;

  addLine('Fixed Prompt', { fontSize: 13, bold: true, lineHeight: 8 });
  addLine(results.fixedPrompt || 'No fixed prompt available.');

  doc.save(`evalloop-${results.agentType.toLowerCase().replace(/\s+/g, '-')}-report.pdf`);
}

export default function ActionButtons({ results, onRunAgain }) {
  const [toast, setToast] = useState('');

  const copyFixedPrompt = async () => {
    await navigator.clipboard?.writeText(results.fixedPrompt);
    setToast('Copied to clipboard!');
    setTimeout(() => setToast(''), 2000);
  };

  const shareResults = async () => {
    await navigator.clipboard?.writeText(buildShareSummary(results));
    setToast('Copied to clipboard!');
    setTimeout(() => setToast(''), 2000);
  };


  const exportDevOpsReports = () => {
    const base = `evalloop-${results.agentType.toLowerCase().replace(/\s+/g, '-')}`;
    downloadText(`${base}.json`, JSON.stringify({ executiveSummary: { agentType: results.agentType, metrics: results.metrics, securityFindings: results.securityFindings, generatedAt: new Date().toISOString() }, ...results }, null, 2), 'application/json');
    downloadText(`${base}.md`, buildMarkdownReport(results), 'text/markdown');
    downloadText(`${base}.html`, buildHtmlReport(results), 'text/html');
    downloadText(`${base}.sarif`, JSON.stringify(buildSarifReport(results), null, 2), 'application/sarif+json');
    downloadText(`${base}.xml`, buildJUnitReport(results), 'application/xml');
    setToast('Reports exported!');
    setTimeout(() => setToast(''), 2000);
  };

  const exportCICD = () => {
    const suite = {
      name: 'EvalLoop Test Suite',
      agentType: results.agentType,
      generatedAt: new Date().toISOString(),
      reliabilityThreshold: 90,
      fixedPrompt: results.fixedPrompt,
      testSuite: results.failures.map((failure) => ({
        id: failure.testId,
        description: `${failure.failureType} test`,
        targetFailure: failure.failureType,
        input: `Test ${failure.testId}`,
        expectedBehavior: 'Agent should handle this without failure',
        severity: failure.severity,
        evidence: failure.evidence,
      })),
      failureSummary: {
        totalTests: 20,
        passed: 20 - results.failures.length,
        failed: results.failures.length,
        reliabilityScore: results.after,
        failuresByType: results.failures.reduce((accumulator, failure) => {
          accumulator[failure.failureType] = (accumulator[failure.failureType] || 0) + 1;
          return accumulator;
        }, {}),
      },
      cicdInstructions:
        'Run this suite before every deployment. Fail the build if reliability drops below threshold.',
    };

    const blob = new Blob([JSON.stringify(suite, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `evalloop-cicd-${results.agentType.toLowerCase().replace(/\s+/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="actions">
      <button className="primary" onClick={copyFixedPrompt}>
        📋 COPY FIXED PROMPT
      </button>
      <button onClick={() => exportPdf(results)}>📄 EXPORT PDF REPORT</button>
      <button onClick={shareResults}>🔗 SHARE RESULTS</button>
      <button onClick={() => document.querySelector('.compare')?.scrollIntoView({ behavior: 'smooth' })}>
        🔁 COMPARE VERSIONS
      </button>
      <button onClick={onRunAgain}>🔄 RUN AGAIN</button>
      <button onClick={exportCICD}>⬇ EXPORT CI/CD TEST SUITE</button>
      <button onClick={exportDevOpsReports}>🧾 EXPORT JSON/MD/HTML/SARIF/JUNIT</button>
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
