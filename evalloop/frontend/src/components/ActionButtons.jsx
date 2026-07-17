import { useState } from 'react';
import { jsPDF } from 'jspdf';

const failureLabels = {
  hallucination: 'Hallucination',
  prompt_misread: 'Prompt Misread',
  bad_tool_call: 'Bad Tool Call',
  context_overflow: 'Context Overflow',
  reasoning_loop: 'Reasoning Loop',
};

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
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
