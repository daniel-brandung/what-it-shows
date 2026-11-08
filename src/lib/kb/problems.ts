// Which problem each report in a merged ticket shows. Pages explain it; this file is what runs.
//
// causes.ts places a report by its tenant: `parser` or `hint`. The desk's own notes
// (desk-notes.json) mark reports whose date moved by one day. No tenant setting explains a one-day
// move, and a month flip never moves a date by one day, so those reports are a problem of their own.
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

// What each problem looks like from the desk, in one line.
export const PROBLEM_LINE: Record<Problem, string> = {
  parser: "The shared parser reads a day-first tenant's dates month first: day and month swap.",
  hint: "booking-v3's form tells people to type MM/DD/YYYY, then reads what they typed day first.",
  'one-day': 'The date moves by one day, not by a month flip: a time-zone shift.',
  unplaced: 'No tenant on file, so no cause can be told.',
};

export function problemOf(r: Report, t: Tenant | undefined): Problem {
  if (notes.oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

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
};

export function groupByProblem(reports: Report[], tenantOf: (r: Report) => Tenant | undefined): ProblemGroup[] {
  const byProblem = new Map<Problem, Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r));
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

// Subject line → reports per problem. Decision 0001 merges on the subject alone.
export type SubjectRow = { subject: string; total: number; byProblem: Partial<Record<Problem, number>>; problems: number };

export function subjectSpread(reports: Report[], tenantOf: (r: Report) => Tenant | undefined): SubjectRow[] {
  const key = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  const rows = new Map<string, SubjectRow>();
  for (const r of reports) {
    const k = key(r.subject);
    const row = rows.get(k) ?? { subject: r.subject, total: 0, byProblem: {}, problems: 0 };
    const p = problemOf(r, tenantOf(r));
    row.total++;
    row.byProblem[p] = (row.byProblem[p] ?? 0) + 1;
    row.problems = Object.keys(row.byProblem).length;
    rows.set(k, row);
  }
  return [...rows.values()].sort((a, b) => b.problems - a.problems || b.total - a.total);
}
