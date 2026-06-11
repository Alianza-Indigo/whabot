import { describe, expect, it } from 'vitest';
import { metricSeries, metricSum, parsePrometheus } from './metrics';

describe('Prometheus helpers', () => {
  it('parses counters with labels and ignores comments', () => {
    const metrics = parsePrometheus(`
# HELP chatbox_messages_processed_total Total inbound messages
chatbox_messages_processed_total 42
chatbox_org_messages_processed_total{org_id="org_1"} 12
chatbox_org_messages_processed_total{org_id="org_2"} 30
`);

    expect(metrics).toEqual([
      { name: 'chatbox_messages_processed_total', labels: {}, value: 42 },
      { name: 'chatbox_org_messages_processed_total', labels: { org_id: 'org_1' }, value: 12 },
      { name: 'chatbox_org_messages_processed_total', labels: { org_id: 'org_2' }, value: 30 },
    ]);
  });

  it('sums matching metric names only', () => {
    const metrics = parsePrometheus(`
chatbox_safety_blocks_total{action_taken="blocked"} 3
chatbox_safety_blocks_total{action_taken="escalated"} 2
chatbox_messages_processed_total 10
`);

    expect(metricSum(metrics, 'chatbox_safety_blocks_total')).toBe(5);
  });

  it('builds chart series from a label key', () => {
    const metrics = parsePrometheus(`
chatbox_org_llm_errors_total{org_id="a",provider="openai"} 1
chatbox_org_llm_errors_total{org_id="b",provider="anthropic"} 4
`);

    expect(metricSeries(metrics, 'chatbox_org_llm_errors_total')).toEqual([
      { name: 'a', value: 1 },
      { name: 'b', value: 4 },
    ]);
  });
});
