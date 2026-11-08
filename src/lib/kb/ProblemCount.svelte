<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, mergedInto, type Problem } from '#lib/kb/problems';

  // A number for a sentence, computed, never typed:
  // <ProblemCount ticket={4471} />                    reports merged into the ticket
  // <ProblemCount ticket={4471} problem="hint" />     reports that show one problem
  // <ProblemCount ticket={4471} of="problems" />      how many problems the ticket holds
  // <ProblemCount ticket={4471} problem="hint" of="tenants" />
  let { ticket, problem, of = 'reports' }: { ticket: number; problem?: Problem; of?: 'reports' | 'problems' | 'tenants' } = $props();

  const merged = $derived(mergedInto(reports as Report[], ticket));
  const groups = $derived(groupByProblem(merged, tenantOf));
  const value = $derived.by(() => {
    if (of === 'problems') return groups.length;
    const picked = problem ? groups.filter((g) => g.problem === problem) : groups;
    if (of === 'tenants') return new Set(picked.flatMap((g) => g.tenants)).size;
    return picked.reduce((n, g) => n + g.reports.length, 0);
  });
</script>

<strong class="count">{value}</strong>

<style>
  .count { font-variant-numeric: tabular-nums; }
</style>
