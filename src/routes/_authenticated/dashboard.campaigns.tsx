import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Megaphone, Trash2, Send, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns — SynthVoice" }] }),
  component: Campaigns,
});

function Campaigns() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").update({ status: "sent" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Marked as broadcasted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = data.filter((c) =>
    !q ||
    c.title.toLowerCase().includes(q.toLowerCase()) ||
    c.message.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Campaigns"
        subtitle="All your saved campaign drafts and broadcasts."
      />
      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-elegant">
          <CardContent className="grid place-items-center py-16 text-center">
            <Megaphone className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Head to the AI Studio and save your first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="shadow-elegant transition hover:-translate-y-0.5 hover:shadow-glow">
              <CardContent className="flex flex-wrap items-start gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{c.title}</h3>
                    <Badge variant={c.status === "sent" ? "default" : "secondary"}>
                      {c.status}
                    </Badge>
                    <Badge variant="outline">{c.language}</Badge>
                    <Badge variant="outline">{c.tone}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Audience: {c.audience} · Created {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {c.status !== "sent" && (
                    <Button size="sm" variant="outline" onClick={() => send.mutate(c.id)} disabled={send.isPending}>
                      <Send className="mr-1.5 h-3.5 w-3.5" />Broadcast
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)} disabled={del.isPending}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
