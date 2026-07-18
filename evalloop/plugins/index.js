export const evaluatorPlugins = [
  { id: 'hallucination', label: 'Hallucination evaluator', enabled: true },
  { id: 'bias', label: 'Bias evaluator', enabled: true },
  { id: 'safety', label: 'Safety evaluator', enabled: true },
  { id: 'prompt_injection', label: 'Prompt Injection evaluator', enabled: true },
  { id: 'reasoning', label: 'Reasoning evaluator', enabled: true },
  { id: 'tool_calling', label: 'Tool Calling evaluator', enabled: true },
];

export function getEnabledPlugins(config = {}) {
  return evaluatorPlugins.filter((plugin) => config[plugin.id] !== false);
}
