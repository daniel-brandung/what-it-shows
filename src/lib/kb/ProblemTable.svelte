<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, mergedInto, PROBLEM_LINE } from '#lib/kb/problems';

  // tickets: problem → the ticket filed for it ({ number, url }).
  let { ticket, tickets = {} }: { ticket: number; tickets?: Record<string, { number: number; url: string }> } = $props();

  const merged = $derived(mergedInto(reports as Report[], ticket));
  const groups = $derived(groupByProblem(merged, tenantOf));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="line">{PROBLEM_LINE[g.problem]}</span></td>
        <td class="n">{g.reports.length}</td>
        <td class="n">{g.tenants.length}</td>
        <td class="muted">{channels(g.channels)}</td>
        <td class="muted">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if tickets[g.problem]}
            <a href={tickets[g.problem].url}>#{tickets[g.problem].number}</a>
          {:else}
            <span class="none">no ticket</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .line { color: var(--muted); font-size: 0.85em; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .n { font-variant-numeric: tabular-nums; }
  .none { color: var(--warn); font-weight: 600; }
</style>
