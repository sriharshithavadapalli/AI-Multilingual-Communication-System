import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  Sparkles,
  Languages,
  BarChart3,
  Clock,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [{ title: "Dashboard — SynthVoice" }],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useSession();
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title, message, language, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const total = campaigns.length;
  const drafts = campaigns.filter((c) => c.status === "draft").length;
  const sent = campaigns.filter((c) => c.status === "sent").length;

  // Language distribution
  const langMap: Record<string, number> = {};
  campaigns.forEach((c) => {
    const l = c.language || "English";
    langMap[l] = (langMap[l] || 0) + 1;
  });
  const langData = Object.entries(langMap).map(([name, value]) => ({ name, value }));

  // Activity over last 7 days
  const activity: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en", { weekday: "short" });
    const count = campaigns.filter((c) => {
      const cd = new Date(c.created_at);
      return cd.toDateString() === d.toDateString();
    }).length;
    activity.push({ day: label, count });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        subtitle="Here's what's happening with your campaigns today."
        actions={
          <Link to="/dashboard/studio">
            <Button className="bg-gradient-primary shadow-glow hover:opacity-90">
              <Sparkles className="mr-2 h-4 w-4" />
              New AI campaign
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total campaigns" value={total} icon={Megaphone} trend="+12%" />
        <StatCard label="Drafts" value={drafts} icon={Clock} accent="amber" />
        <StatCard label="Broadcasted" value={sent} icon={TrendingUp} accent="emerald" />
        <StatCard label="Languages used" value={Object.keys(langMap).length} icon={Languages} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Campaign activity — last 7 days
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(265 80% 60%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(265 80% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 60% / 0.2)" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 80% / 0.3)" }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(265 80% 60%)" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {langData.length ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={langData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={70} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(285 80% 65%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="grid h-56 place-items-center text-sm text-muted-foreground">
                No language data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="grid place-items-center py-10 text-center">
                <Megaphone className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No campaigns yet.</p>
                <Link to="/dashboard/studio" className="mt-3">
                  <Button size="sm" variant="outline">Create your first</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {campaigns.slice(0, 5).map((c) => (
                  <Link
                    to="/dashboard/campaigns"
                    key={c.id}
                    className="flex items-start gap-3 py-3 hover:bg-muted/50"
                  >
                    <div className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-primary/10">
                      <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-sm">{c.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.message}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{c.language}</div>
                      <div className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        c.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {c.status}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction to="/dashboard/studio" icon={Sparkles} label="Generate message" />
            <QuickAction to="/dashboard/studio" icon={Languages} label="Translate copy" />
            <QuickAction to="/dashboard/campaigns" icon={Megaphone} label="View all campaigns" />
            <QuickAction to="/dashboard/analytics" icon={BarChart3} label="Open analytics" />
            <QuickAction to="/dashboard/audience" icon={Users} label="Manage audience" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  accent?: "amber" | "emerald";
}) {
  const iconBg =
    accent === "amber"
      ? "bg-amber-500/10 text-amber-600"
      : accent === "emerald"
        ? "bg-emerald-500/10 text-emerald-600"
        : "bg-primary/10 text-primary";
  return (
    <Card className="shadow-elegant">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <div className="text-2xl font-bold">{value}</div>
            {trend && <span className="text-xs text-emerald-600">{trend}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-transparent p-2.5 text-sm transition hover:border-border hover:bg-muted"
    >
      <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1">{label}</span>
    </Link>
  );
}
