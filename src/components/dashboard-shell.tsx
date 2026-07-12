import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Sparkles,
  Languages,
  Mic,
  Radio,
  Megaphone,
  Users,
  FileText,
  BarChart3,
  Bell,
  History,
  Settings,
  User,
  LogOut,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  Globe2,
  MessageCircle,
  Mail,
  Smartphone,
  QrCode,
  Image as ImageIcon,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    group: "AI Tools",
    items: [
      { to: "/dashboard/studio", label: "AI Studio", icon: Sparkles },
      { to: "/dashboard/translation", label: "Translation", icon: Languages },
      { to: "/dashboard/speech", label: "Speech Tools", icon: Mic },
      { to: "/dashboard/emergency", label: "Emergency Alerts", icon: ShieldAlert },
    ],
  },
  {
    group: "Broadcast",
    items: [
      { to: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageCircle, badge: "soon" },
      { to: "/dashboard/email", label: "Email", icon: Mail, badge: "soon" },
      { to: "/dashboard/sms", label: "SMS", icon: Smartphone, badge: "soon" },
      { to: "/dashboard/qr", label: "QR Codes", icon: QrCode },
      { to: "/dashboard/poster", label: "Poster Studio", icon: ImageIcon, badge: "soon" },
      { to: "/dashboard/scheduler", label: "Scheduler", icon: CalendarClock, badge: "soon" },
    ],
  },
  {
    group: "Account",
    items: [
      { to: "/dashboard/audience", label: "Audience", icon: Users },
      { to: "/dashboard/templates", label: "Templates", icon: FileText },
      { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { to: "/dashboard/history", label: "History", icon: History },
      { to: "/dashboard/profile", label: "Profile", icon: User },
      { to: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("theme")) as
      | "light"
      | "dark"
      | null;
    const initial =
      stored ??
      (typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };
  return { theme, toggle };
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useSession();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  const initials =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ").map((s) => s[0]).slice(0, 2).join("") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-card shadow-xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <SidebarBrand />
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div onClick={() => setMobileOpen(false)}>
              <SidebarLinks pathname={pathname} />
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass border-b">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns, messages, languages…"
                className="pl-9 bg-background/60"
              />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 flex items-center gap-2 rounded-full p-1 hover:bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
        <Globe2 className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-lg font-semibold tracking-tight">SynthVoice</span>
    </Link>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <SidebarBrand />
      </div>
      <SidebarLinks pathname={pathname} />
    </div>
  );
}

function SidebarLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {NAV.map((group) => (
        <div key={group.group}>
          <div className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.group}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`group flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition ${
                      active
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        active ? "bg-white/20" : "bg-muted-foreground/10 text-muted-foreground"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="pt-2 text-center text-[11px] text-muted-foreground">
        <Radio className="mx-auto mb-1 h-3.5 w-3.5" />
        Powered by Lovable AI
      </div>
    </nav>
  );
}

export function PageHeader({ title, subtitle, actions }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function ComingSoon({ title, description, icon: Icon }: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="glass rounded-2xl p-10 text-center shadow-elegant">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
            <span className="relative h-2 w-2 rounded-full bg-primary" />
          </span>
          In development
        </div>
      </div>
    </div>
  );
}
