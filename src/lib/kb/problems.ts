// Which problems a merged ticket holds, counted the way the desk counts. Pages explain it; this file is what runs.
//
// The desk's own view (CauseTable) counts every report under its cause, by tenant: `parser` or `hint`
// (causes.ts). The desk's notes (desk-notes.json) mark reports it read as a one-day move. Those stay
// counted where they are filed, as the cause table does. They also get a row of their own, because no
// tenant setting explains a one-day move and a month flip never moves a date by one day.
import notes from '#lib/data/desk-notes.json';
import { causeOf, groupByCause, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

// What each problem looks like from the desk, in one line.
export const PROBLEM_LINE: Record<Problem, string> = {
  parser: "The shared parser reads a day-first tenant's dates month first: day and month swap.",
  hint: "booking-v3's form tells people to type MM/DD/YYYY, then reads what they typed day first.",
  'one-day': 'The date moves by one day, not by a month flip: a time-zone shift.',
  unplaced: 'No tenant on file, so no cause can be told.',
};

// One id, one report, and only the reports merged into this ticket.
export function mergedInto(reports: Report[], ticket: number): Report[] {
  return uniqueById(reports).filter((r) => r.mergedInto === ticket);
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // Reports in this group that the desk read as a one-day move (they also count under `one-day`).
  readAsOneDay: number;
};

function group(problem: Problem, rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    readAsOneDay: problem === 'one-day' ? 0 : rs.filter((r) => notes.oneDayMove.includes(r.id)).length,
  };
}

export function groupByProblem(reports: Report[], tenantOf: (r: Report) => Tenant | undefined): ProblemGroup[] {
  const causes = groupByCause(reports, tenantOf).map((g) => group(g.cause, g.reports));
  const moved = reports.filter((r) => notes.oneDayMove.includes(r.id));
  return moved.length ? [...causes, group('one-day', moved)] : causes;
}

// How many reports count in two rows: filed under their cause, read as a one-day move.
export function countedTwice(groups: ProblemGroup[]): number {
  return groups.reduce((n, g) => n + g.readAsOneDay, 0);
}

// Subject line → reports per problem, counted like the table above. Decision 0001 merges on the subject alone.
export type SubjectRow = { subject: string; total: number; byProblem: Partial<Record<Problem, number>>; problems: number };

export function subjectSpread(reports: Report[], tenantOf: (r: Report) => Tenant | undefined): SubjectRow[] {
  const key = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  const rows = new Map<string, SubjectRow>();
  const add = (row: SubjectRow, p: Problem) => (row.byProblem[p] = (row.byProblem[p] ?? 0) + 1);
  for (const r of reports) {
    const k = key(r.subject);
    const row = rows.get(k) ?? { subject: r.subject, total: 0, byProblem: {}, problems: 0 };
    row.total++;
    add(row, causeOf(r, tenantOf(r)) ?? 'unplaced');
    if (notes.oneDayMove.includes(r.id)) add(row, 'one-day');
    row.problems = Object.keys(row.byProblem).length;
    rows.set(k, row);
  }
  return [...rows.values()].sort((a, b) => b.problems - a.problems || b.total - a.total);
}
