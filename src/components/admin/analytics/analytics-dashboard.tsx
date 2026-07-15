import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, FileText, TrendingUp, Users } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { ChartPanel } from "@/components/data-visualization/chart-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  className?: string;
}

const categoricalColors = [
  "var(--chart-blue)",
  "var(--chart-teal)",
  "var(--chart-ochre)",
  "var(--chart-plum)",
];

function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <table className="manifest-table min-w-[34rem]">
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row" className="font-medium normal-case tracking-normal">{cell}</th> : <td key={cellIndex} className="font-mono text-xs tabular-nums">{cell}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30");
  const days = Number(timeRange);
  const userGrowthQuery = useQuery(api.analytics.getUserGrowthAnalytics, { days });
  const listAnalyticsQuery = useQuery(api.analytics.getListAnalytics, { days });
  const systemUsage = useQuery(api.analytics.getSystemUsageAnalytics, {});
  const templateAnalytics = useQuery(api.analytics.getTemplateAnalytics, {});
  const dashboardMetrics = useQuery(api.analytics.getDashboardMetrics, {});

  const userGrowth = useMemo(
    () => [...(userGrowthQuery ?? [])].sort((left, right) => left.date.localeCompare(right.date)),
    [userGrowthQuery],
  );
  const listActivity = useMemo(
    () => [...(listAnalyticsQuery?.dailyData ?? [])].sort((left, right) => left.date.localeCompare(right.date)),
    [listAnalyticsQuery?.dailyData],
  );
  const popularTemplates = useMemo(
    () => [...(templateAnalytics?.popularTemplates ?? [])]
      .sort((left, right) => right.usageCount - left.usageCount || left.name.localeCompare(right.name))
      .slice(0, 5),
    [templateAnalytics?.popularTemplates],
  );

  if (!userGrowthQuery || !listAnalyticsQuery || !systemUsage || !templateAnalytics || !dashboardMetrics) {
    return <p className={cn("py-16 text-center text-muted-foreground", className)}>Loading operational analytics…</p>;
  }

  const activity = [
    { name: "High", value: systemUsage.userActivity.high },
    { name: "Medium", value: systemUsage.userActivity.medium },
    { name: "Low", value: systemUsage.userActivity.low },
    { name: "Inactive", value: systemUsage.userActivity.inactive },
  ];
  const userGrowthChange = dashboardMetrics.trends.growth;
  const userGrowthDetail = userGrowthChange.status === "unavailable" && userGrowthChange.reason === "zero_baseline"
    ? "Percentage growth requires registrations in the prior 7-day period."
    : `${dashboardMetrics.trends.newUsersToday} registrations today`;
  const metrics = [
    { label: "Active users", value: dashboardMetrics.realTime.activeUsers, detail: "Users with at least one list", icon: Users },
    { label: "Lists today", value: dashboardMetrics.realTime.listsToday, detail: `${dashboardMetrics.trends.newListsWeek} during the last 7 days`, icon: FileText },
    { label: "Completions", value: dashboardMetrics.realTime.completionsToday, detail: `${systemUsage.overview.completionRate}% across all lists`, icon: CheckCircle2 },
    { label: "User growth", value: userGrowthChange.formatted, detail: userGrowthDetail, icon: TrendingUp },
  ];

  return (
    <section className={cn("space-y-6", className)} aria-labelledby="analytics-title">
      <div className="sticky top-16 z-20 flex flex-col gap-3 border-y border-border bg-background/95 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div><h2 id="analytics-title" className="text-2xl font-semibold">Operational analytics</h2><p className="text-sm text-muted-foreground">Exact values, fixed ordering, and the selected comparison period. Updates live from Convex.</p></div>
        <Select value={timeRange} onValueChange={setTimeRange}><SelectTrigger className="w-full sm:w-36" aria-label="Analytics period"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 90 days</SelectItem></SelectContent></Select>
      </div>

      <dl className="grid grid-cols-2 border-y border-border xl:grid-cols-4">
        {metrics.map(({ detail, icon: Icon, label, value }) => (
          <div key={label} className="border-b border-border p-4 last:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0">
            <dt className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground"><Icon className="h-4 w-4" aria-hidden="true" />{label}</dt>
            <dd className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</dd>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </dl>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel
          title="User activity"
          description="Users grouped by fixed activity level for the current system snapshot."
          legend={activity.map((entry, index) => ({ label: entry.name, color: categoricalColors[index] }))}
          table={<DataTable caption="User activity by activity level" headers={["Activity level", "Users"]} rows={activity.map((entry) => [entry.name, entry.value])} />}
        >
          <div role="img" aria-label="Horizontal bars showing users by activity level" className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} layout="vertical" margin={{ left: 8, right: 24 }} accessibilityLayer>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" domain={[0, "dataMax"]} allowDecimals={false} tick={{ fill: "var(--muted-ink)", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fill: "var(--ink)", fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${Number(value)} users`, "Users"]} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" name="Users" radius={[0, 4, 4, 0]}>
                  {activity.map((entry, index) => <Cell className="chart-mark" key={entry.name} fill={categoricalColors[index]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel
          title="User registrations"
          description={`New registrations by day during the last ${days} days.`}
          table={<DataTable caption={`User registrations, last ${days} days`} headers={["Date", "New users"]} rows={userGrowth.map((entry) => [entry.formattedDate, entry.newUsers])} />}
        >
          <div role="img" aria-label={`Line chart of new user registrations during the last ${days} days`} className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth} margin={{ left: 0, right: 16 }} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="formattedDate" tick={{ fill: "var(--muted-ink)", fontSize: 11 }} minTickGap={24} />
                <YAxis allowDecimals={false} domain={[0, "dataMax"]} tick={{ fill: "var(--muted-ink)", fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${Number(value)} new users`, "Registrations"]} labelFormatter={(label) => `Period: ${label}`} />
                <Line dataKey="newUsers" name="New users" stroke="var(--chart-blue)" strokeWidth={2} dot={{ r: 4, fill: "var(--chart-blue)", stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel
          title="List activity"
          description={`Created and completed lists by day during the last ${days} days.`}
          legend={[{ label: "Created", color: "var(--chart-blue)" }, { label: "Completed", color: "var(--chart-teal)", dash: true }]}
          table={<DataTable caption={`List activity, last ${days} days`} headers={["Date", "Created", "Completed"]} rows={listActivity.map((entry) => [entry.formattedDate, entry.created, entry.completed])} />}
        >
          <div role="img" aria-label={`Line chart of created and completed lists during the last ${days} days`} className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={listActivity} margin={{ left: 0, right: 16 }} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="formattedDate" tick={{ fill: "var(--muted-ink)", fontSize: 11 }} minTickGap={24} />
                <YAxis allowDecimals={false} domain={[0, "dataMax"]} tick={{ fill: "var(--muted-ink)", fontSize: 11 }} />
                <Tooltip formatter={(value, name) => [`${Number(value)} lists`, String(name)]} labelFormatter={(label) => `Period: ${label}`} />
                <Line dataKey="created" name="Created" stroke="var(--chart-blue)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line dataKey="completed" name="Completed" stroke="var(--chart-teal)" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel
          title="Popular templates"
          description="Top templates ranked by usage count with deterministic name tie-breaks."
          table={<DataTable caption="Popular templates by usage count" headers={["Template", "Uses"]} rows={popularTemplates.map((entry) => [entry.name, entry.usageCount])} />}
        >
          <div role="img" aria-label="Horizontal bars ranking popular templates by usage count" className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularTemplates} layout="vertical" margin={{ left: 12, right: 24 }} accessibilityLayer>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" domain={[0, "dataMax"]} allowDecimals={false} tick={{ fill: "var(--muted-ink)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={112} tick={{ fill: "var(--ink)", fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${Number(value)} uses`, "Template usage"]} cursor={{ fill: "var(--muted)" }} />
                <Bar className="chart-mark" dataKey="usageCount" name="Usage count" fill="var(--chart-blue)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </div>
    </section>
  );
}
