<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { countedTwice, groupByProblem, mergedInto, PROBLEM_LINE } from '#lib/kb/problems';

  type Ticket = { number: number; url: string; state: 'open' | 'closed'; reason: string | null; why: string };
  // tickets: problem → the ticket filed for it, and where it stands.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Record<string, Ticket> } = $props();

  const merged = $derived(mergedInto(reports as Report[], ticket));
  const groups = $derived(groupByProblem(merged, tenantOf));
  const twice = $derived(countedTwice(groups));
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
      {@const t = tickets[g.problem]}
      <tr class:open={t?.state === 'open'}>
        <td><code>{g.problem}</code><br /><span class="line">{PROBLEM_LINE[g.problem]}</span></td>
        <td class="n">{g.reports.length}</td>
        <td class="n">{g.tenants.length}</td>
        <td class="muted">{channels(g.channels)}</td>
        <td class="muted">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if t}
            <a href={t.url}>#{t.number}</a>
            <span class="state {t.state}">{t.state}{t.reason ? ` · ${t.reason}` : ''}</span>
            <span class="line">{t.why}</span>
          {:else}
            <span class="none">no ticket</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if twice}
  <p class="note">
    {twice} reports count in two rows: the desk files them under their cause by tenant, and reads them as a
    one-day move.
  </p>
{/if}

<style>
  .sum { font-size: 1.1rem; }
  .line { display: block; color: var(--muted); font-size: 0.85em; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .n { font-variant-numeric: tabular-nums; }
  .none { color: var(--warn); font-weight: 600; }
  .state { border: 1px solid var(--line); border-radius: 99px; padding: 0 0.5rem; font-size: 0.8em; margin-left: 0.25rem; }
  .open td:last-child .state { color: var(--warn); border-color: var(--warn); font-weight: 600; }
</style>
