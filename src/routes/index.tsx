import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Languages, Mic, BarChart3, ShieldCheck, Zap,
  Globe2, MessageSquare, ArrowRight, LogIn, UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  { icon: Sparkles, title: "AI Message Generator", desc: "Draft ready-to-broadcast campaign messages from a short brief." },
  { icon: Languages, title: "18+ Languages", desc: "Hindi, Telugu, Tamil, Bengali, Arabic, Spanish, Chinese and more." },
  { icon: MessageSquare, title: "Tone Conversion", desc: "Formal, friendly, government, emergency, marketing — one click." },
  { icon: BarChart3, title: "Sentiment Analysis", desc: "Score audience reception with emotion breakdown and confidence." },
  { icon: ShieldCheck, title: "Grammar & Rewrite", desc: "Polish drafts with correction, summarization and keyword extraction." },
  { icon: Zap, title: "Built for Scale", desc: "Serverless AI. Ready to plug into SMS, email and social APIs." },
];

const STATS = [
  { k: "18+", v: "Languages" }, { k: "10", v: "AI Tools" },
  { k: "<2s", v: "Avg latency" }, { k: "100%", v: "Serverless" },
];

function Landing() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-hero">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
              <Globe2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SynthVoice</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#stats" className="hover:text-foreground">Platform</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          {authed ? (
            <Link to="/dashboard">
              <Button className="bg-gradient-primary shadow-glow hover:opacity-90">
                Open Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link to="/auth" className="hidden sm:inline-flex">
                <Button variant="ghost"><LogIn className="mr-1.5 h-4 w-4" />Login</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary shadow-glow hover:opacity-90">
                  <UserPlus className="mr-1.5 h-4 w-4" />Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl overflow-hidden px-6 pt-16 pb-24 text-center md:pt-24">
        {/* Floating blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-10 h-64 w-64 animate-[float_8s_ease-in-out_infinite] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute right-1/4 top-20 h-64 w-64 animate-[float_10s_ease-in-out_infinite_reverse] rounded-full bg-primary-glow/20 blur-3xl" />
        </div>

        <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <Sparkles className="h-3 w-3 text-primary" />
          AI-based Multilingual Mass Communication Platform
        </div>

        <h1 className="mt-6 animate-fade-in text-balance text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="block">AI-Based Multilingual</span>
          <span className="mt-2 block bg-gradient-primary bg-clip-text text-transparent">
            Mass Communication
          </span>
          <span className="mt-2 block">Platform</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl animate-fade-in text-lg text-muted-foreground md:text-xl">
          Communicate with <b className="text-foreground">everyone</b>,{" "}
          <b className="text-foreground">everywhere</b>, in{" "}
          <b className="text-foreground">every language</b> using Artificial Intelligence.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {authed ? (
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary shadow-glow hover:opacity-90">
                <Sparkles className="mr-2 h-4 w-4" />Get Started
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary shadow-glow hover:opacity-90">
                  <Sparkles className="mr-2 h-4 w-4" />Get Started
                </Button>
              </Link>
              <Link to="/auth" className="hidden sm:inline-flex">
                <Button size="lg" variant="outline"><LogIn className="mr-2 h-4 w-4" />Login</Button>
              </Link>
              <Link to="/auth" className="hidden sm:inline-flex">
                <Button size="lg" variant="outline"><UserPlus className="mr-2 h-4 w-4" />Register</Button>
              </Link>
            </>
          )}
          <a href="#features">
            <Button size="lg" variant="ghost">Explore features →</Button>
          </a>
        </div>

        <div id="stats" className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.v} className="glass animate-fade-in rounded-xl px-4 py-5 text-center shadow-elegant" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-3xl font-bold tracking-tight">{s.k}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything a campaign needs
          </h2>
          <p className="mt-3 text-muted-foreground">One studio, ten AI capabilities, eighteen languages.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group relative animate-fade-in overflow-hidden rounded-2xl border bg-card p-6 shadow-elegant transition hover:-translate-y-1 hover:shadow-glow"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center shadow-glow md:p-16">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl">
            Draft your first multilingual campaign in under a minute.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            No setup. No API keys. Just sign in and start writing.
          </p>
          <div className="mt-8">
            <Link to={authed ? "/dashboard" : "/auth"}>
              <Button size="lg" variant="secondary" className="shadow-elegant">
                <Mic className="mr-2 h-4 w-4" />
                {authed ? "Open Dashboard" : "Create free account"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">Frequently asked</h2>
        <div className="space-y-3">
          {[
            { q: "Which languages are supported?", a: "English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Bengali, Urdu, French, Spanish, German, Chinese, Japanese, Arabic and Russian." },
            { q: "Do I need to bring my own API key?", a: "No. The studio uses Lovable AI Gateway with a project-scoped key managed for you." },
            { q: "Can this integrate with SMS, WhatsApp or email?", a: "Yes — the AI layer is decoupled. Connect any broadcast provider on top of the generated content." },
          ].map((item) => (
            <details key={item.q} className="group rounded-xl border bg-card px-5 py-4 shadow-sm">
              <summary className="cursor-pointer list-none font-medium">{item.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} SynthVoice — AI Mass Communication.</div>
          <div>Built with TanStack Start · Lovable Cloud · AI Gateway</div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -30px); }
        }
      `}</style>
    </div>
  );
}
