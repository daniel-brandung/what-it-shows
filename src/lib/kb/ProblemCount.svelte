<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { countedTwice, groupByProblem, mergedInto, type Problem } from '#lib/kb/problems';

  // A number for a sentence, computed, never typed:
  // <ProblemCount ticket={4471} />                              reports merged into the ticket
  // <ProblemCount ticket={4471} of="problems" />                how many problems the ticket holds
  // <ProblemCount ticket={4471} problem="hint" />               reports that count under one problem
  // <ProblemCount ticket={4471} problem="hint" of="tenants" />  tenants those reports come from
  // <ProblemCount ticket={4471} of="twice" />                   reports counted under two problems
  let {
    ticket,
    problem,
    of = 'reports',
  }: { ticket: number; problem?: Problem; of?: 'reports' | 'problems' | 'tenants' | 'twice' } = $props();

  const merged = $derived(mergedInto(reports as Report[], ticket));
  const groups = $derived(groupByProblem(merged, tenantOf));
  const picked = $derived(groups.find((g) => g.problem === problem));
  const value = $derived.by(() => {
    if (of === 'problems') return groups.length;
    if (of === 'twice') return countedTwice(groups);
    if (!problem) return of === 'tenants' ? new Set(merged.map((r) => r.tenant)).size : merged.length;
    if (of === 'tenants') return picked?.tenants.length ?? 0;
    return picked?.reports.length ?? 0;
  });
</script>

<strong class="count">{value}</strong>

<style>
  .count { font-variant-numeric: tabular-nums; }
</style>
