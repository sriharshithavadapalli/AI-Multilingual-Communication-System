import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon, PageHeader } from "@/components/dashboard-shell";
import {
  MessageCircle, Mail, Smartphone, QrCode, Image as ImageIcon,
  CalendarClock, ShieldAlert, Languages, Mic, Users, FileText, Bell, History, Settings, BarChart3,
} from "lucide-react";

const PAGES: Record<string, { title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  whatsapp:      { title: "WhatsApp Broadcasting",   description: "Send translated campaigns to WhatsApp audience lists. Provider integration coming next.", icon: MessageCircle },
  email:         { title: "Email Campaigns",         description: "Design and dispatch email blasts. Managed sender setup coming next.",                    icon: Mail },
  sms:           { title: "SMS Broadcasting",        description: "One-click SMS delivery through a licensed gateway.",                                    icon: Smartphone },
  poster:        { title: "Poster Studio",           description: "AI-generated posters and social cards from your campaign text.",                        icon: ImageIcon },
  scheduler:     { title: "Campaign Scheduler",      description: "Queue campaigns for future broadcast windows and recurring blasts.",                    icon: CalendarClock },
  emergency:     { title: "Emergency Alerts",        description: "Prioritized emergency broadcast pipeline for critical announcements.",                  icon: ShieldAlert },
  translation:   { title: "Translation Center",      description: "Batch translate documents and campaign libraries at once.",                              icon: Languages },
  speech:        { title: "Speech Tools",            description: "Text-to-speech in multiple voices and speech-to-text transcription.",                   icon: Mic },
  audience:      { title: "Audience Manager",        description: "Segment recipient lists by language, region, or role.",                                 icon: Users },
  templates:     { title: "Templates Library",       description: "Reusable message templates for common government/NGO scenarios.",                       icon: FileText },
  notifications: { title: "Notifications",           description: "Real-time notifications from your active campaigns and audience responses.",             icon: Bell },
  history:       { title: "Activity History",        description: "Full audit trail of every AI action and campaign event.",                               icon: History },
  settings:      { title: "Settings",                description: "Workspace preferences, notification rules, and integrations.",                          icon: Settings },
  analytics:     { title: "Analytics",               description: "Deep-dive analytics across languages, audiences, and campaign performance.",             icon: BarChart3 },
  qr:            { title: "QR Code Generator",       description: "Generate branded QR codes for campaign links, posters and voice announcements.",        icon: QrCode },
};

export const Route = createFileRoute("/_authenticated/dashboard/$page")({
  head: ({ params }) => {
    const p = PAGES[params.page];
    return { meta: [{ title: `${p?.title ?? "Dashboard"} — SynthVoice` }] };
  },
  component: DynamicPage,
});

function DynamicPage() {
  const { page } = Route.useParams();
  const info = PAGES[page];
  if (!info) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">This dashboard section doesn't exist.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={info.title} subtitle={info.description} />
      <ComingSoon title="This module is on the way" description="The UI is scaffolded — provider hookups and data flows land in the next milestone." icon={info.icon} />
    </div>
  );
}
