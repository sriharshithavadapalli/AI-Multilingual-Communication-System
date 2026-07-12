import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { runAi } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles, Languages, MessageSquare, SpellCheck2, FileText,
  Hash, Tag, BarChart3, RefreshCw, Copy, Loader2, Save,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_authenticated/dashboard/studio")({
  head: () => ({ meta: [{ title: "AI Studio — SynthVoice" }] }),
  component: Studio,
});

const LANGS = [
  "Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi","Gujarati","Punjabi",
  "Bengali","Urdu","English","French","Spanish","German","Chinese","Japanese","Arabic","Russian",
];
const TONES = ["Formal","Friendly","Government","Emergency","Marketing","Professional","Motivational","Educational"];
const AUDIENCES = ["General public","Rural citizens","Urban youth","Farmers","Students","Healthcare workers","Small business owners","Senior citizens"];

type Task = "generate"|"translate"|"tone"|"grammar"|"summarize"|"keywords"|"hashtags"|"sentiment"|"rewrite";

const TABS: { id: Task; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }[] = [
  { id: "generate", label: "Generate", icon: Sparkles, placeholder: "e.g. Encourage rural families to attend the free polio vaccination camp this Sunday." },
  { id: "translate", label: "Translate", icon: Languages, placeholder: "Paste the message to translate…" },
  { id: "tone", label: "Tone", icon: MessageSquare, placeholder: "Paste a message and pick a tone…" },
  { id: "grammar", label: "Grammar", icon: SpellCheck2, placeholder: "Paste text to correct…" },
  { id: "summarize", label: "Summarize", icon: FileText, placeholder: "Paste a long announcement to summarize…" },
  { id: "rewrite", label: "Rewrite", icon: RefreshCw, placeholder: "Paste a rough draft to polish…" },
  { id: "keywords", label: "Keywords", icon: Tag, placeholder: "Paste text to extract keywords from…" },
  { id: "hashtags", label: "Hashtags", icon: Hash, placeholder: "Paste text for hashtag suggestions…" },
  { id: "sentiment", label: "Sentiment", icon: BarChart3, placeholder: "Paste a message or feedback…" },
];

function Studio() {
  const [task, setTask] = useState<Task>("generate");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [tone, setTone] = useState("Formal");
  const [audience, setAudience] = useState("General public");
  const [output, setOutput] = useState("");

  const runAiFn = useServerFn(runAi);
  type Payload = { task: Task; text: string; targetLanguage?: string; tone?: string; audience?: string };
  const mutation = useMutation({
    mutationFn: (p: Payload) => runAiFn({ data: p }),
    onSuccess: (r) => { setOutput(r.output); toast.success("Done"); },
    onError: (e: Error) => toast.error(e.message || "Something went wrong"),
  });

  const active = TABS.find((t) => t.id === task)!;

  function submit() {
    if (!text.trim()) return toast.error("Please enter some text first");
    setOutput("");
    mutation.mutate({
      task, text,
      targetLanguage: task === "translate" ? language : undefined,
      tone: task === "tone" || task === "generate" ? tone : undefined,
      audience: task === "generate" ? audience : undefined,
    });
  }

  function copyOut() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success("Copied");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="AI Studio"
        subtitle="Nine AI tools for multilingual mass communication."
      />

      <Tabs value={task} onValueChange={(v) => { setTask(v as Task); setOutput(""); }}>
        <TabsList className="mb-6 flex h-auto flex-wrap justify-start gap-1 bg-card p-1 shadow-elegant">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-2">
              <t.icon className="h-4 w-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id} className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-elegant">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <t.icon className="h-4 w-4 text-primary" />
                    Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t.placeholder}
                    className="min-h-[220px] resize-y"
                  />

                  {t.id === "translate" && (
                    <LabeledSelect label="Target language" value={language} onChange={setLanguage} options={LANGS} />
                  )}
                  {(t.id === "tone" || t.id === "generate") && (
                    <LabeledSelect label="Tone" value={tone} onChange={setTone} options={TONES} />
                  )}
                  {t.id === "generate" && (
                    <LabeledSelect label="Audience" value={audience} onChange={setAudience} options={AUDIENCES} />
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">{text.length} / 6000</span>
                    <Button
                      onClick={submit}
                      disabled={mutation.isPending}
                      className="bg-gradient-primary shadow-glow hover:opacity-90"
                    >
                      {mutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working…</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" />Run {active.label}</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-base">Output</CardTitle>
                  <div className="flex gap-1">
                    <SaveCampaign
                      disabled={!output}
                      message={output}
                      language={t.id === "translate" ? language : "English"}
                      tone={t.id === "tone" || t.id === "generate" ? tone : "Formal"}
                      audience={t.id === "generate" ? audience : "General public"}
                    />
                    <Button size="sm" variant="ghost" onClick={copyOut} disabled={!output}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[220px] rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
                    {mutation.isPending && !output ? (
                      <SkeletonLines />
                    ) : output ? (
                      t.id === "sentiment" ? <SentimentView raw={output} /> : <pre className="whitespace-pre-wrap font-sans">{output}</pre>
                    ) : (
                      <p className="text-muted-foreground">Results will appear here.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SaveCampaign({ disabled, message, language, tone, audience }: {
  disabled: boolean; message: string; language: string; tone: string; audience: string;
}) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return toast.error("Give it a title");
    if (!user) return toast.error("Please sign in again");
    setSaving(true);
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      title,
      message,
      language,
      tone,
      audience,
      status: "draft",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved as draft campaign");
    setOpen(false);
    setTitle("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" disabled={disabled}>
          <Save className="mr-1.5 h-3.5 w-3.5" />Save
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Campaign title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground line-clamp-4">{message}</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-primary shadow-glow">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function SkeletonLines() {
  return (
    <div className="space-y-2">
      {[100, 90, 80, 95, 60].map((w, i) => (
        <div key={i} className="h-3 animate-pulse rounded bg-foreground/10" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function SentimentView({ raw }: { raw: string }) {
  let parsed: { label?: string; score?: number; emotion?: string; rationale?: string } | null = null;
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : null;
  } catch { parsed = null; }
  if (!parsed) return <pre className="whitespace-pre-wrap font-sans">{raw}</pre>;

  const label = (parsed.label || "neutral").toLowerCase();
  const color = label === "positive" ? "bg-emerald-500" : label === "negative" ? "bg-rose-500" : "bg-amber-500";
  const pct = Math.round(((parsed.score ?? 0) as number) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${color}`}>{label}</span>
        {parsed.emotion && (
          <span className="text-xs text-muted-foreground">
            Emotion: <b className="text-foreground">{parsed.emotion}</b>
          </span>
        )}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Confidence</span><span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {parsed.rationale && <p className="text-sm text-muted-foreground">{parsed.rationale}</p>}
    </div>
  );
}
