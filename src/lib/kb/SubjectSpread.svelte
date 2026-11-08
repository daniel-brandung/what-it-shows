<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, mergedInto, subjectSpread } from '#lib/kb/problems';

  // Which problems hide behind each subject line. Decision 0001 merges on the subject alone.
  let { ticket }: { ticket: number } = $props();

  const merged = $derived(mergedInto(reports as Report[], ticket));
  const problems = $derived(groupByProblem(merged, tenantOf).map((g) => g.problem));
  const rows = $derived(subjectSpread(merged, tenantOf));
  const mixed = $derived(rows.filter((r) => r.problems > 1).length);
</script>

<p class="sum">
  <strong>{mixed}</strong> of <strong>{rows.length}</strong> subject lines carry more than one problem.
</p>

<table>
  <thead>
    <tr>
      <th>subject</th>
      {#each problems as p (p)}<th><code>{p}</code></th>{/each}
    </tr>
  </thead>
  <tbody>
    {#each rows as r (r.subject)}
      <tr class:mixed={r.problems > 1}>
        <td>{r.subject}</td>
        {#each problems as p (p)}<td class="n">{r.byProblem[p] ?? '–'}</td>{/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1rem; }
  .n { font-variant-numeric: tabular-nums; color: var(--muted); }
  .mixed td:first-child { font-weight: 600; }
</style>
