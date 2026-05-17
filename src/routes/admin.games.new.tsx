import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/admin/games/new")({ component: () => <GameForm /> });

export function GameForm({ existing }: { existing?: any }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [f, setF] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    prize_description: existing?.prize_description ?? "",
    ticket_price: existing?.ticket_price ?? 100,
    total_tickets: existing?.total_tickets ?? 100,
    payment_account_name: existing?.payment_account_name ?? "",
    payment_account_number: existing?.payment_account_number ?? "",
    payment_bank: existing?.payment_bank ?? "CBE",
    status: existing?.status ?? "draft",
    starts_at: existing?.starts_at?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
    ends_at: existing?.ends_at?.slice(0, 16) ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let image_url = existing?.game_image_url ?? null;
      if (file) {
        const path = `game-${Date.now()}.${file.name.split(".").pop()}`;
        const { error: upErr } = await supabase.storage.from("game-images").upload(path, file, { upsert: true });
        if (upErr) { console.error("upload err", upErr); toast.error("ምስል መጫን አልተሳካም: " + upErr.message); setBusy(false); return; }
        image_url = supabase.storage.from("game-images").getPublicUrl(path).data.publicUrl;
      }
      const payload: any = {
        title: f.title,
        description: f.description || null,
        prize_description: f.prize_description || null,
        ticket_price: Number(f.ticket_price),
        total_tickets: Number(f.total_tickets),
        payment_account_name: f.payment_account_name || null,
        payment_account_number: f.payment_account_number || null,
        payment_bank: f.payment_bank || null,
        status: f.status,
        starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null,
        ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
        game_image_url: image_url,
        created_by: user?.id,
      };
      if (!user?.id) { toast.error("እባክዎ ይግቡ"); setBusy(false); return; }
      if (!payload.title || !payload.ticket_price || !payload.total_tickets) {
        toast.error("ርዕስ፣ ዋጋ እና ቲኬት ቁጥር ያስፈልጋሉ"); setBusy(false); return;
      }
      const { error } = existing
        ? await supabase.from("games").update(payload).eq("id", existing.id)
        : await supabase.from("games").insert(payload);
      if (error) {
        console.error("game save error", error);
        toast.error(error.message || "ማስቀመጥ አልተሳካም");
        setBusy(false);
        return;
      }
      toast.success("ተቀምጧል");
      navigate({ to: "/admin/games" });
    } catch (err: any) {
      console.error("unexpected", err);
      toast.error(err?.message ?? "ስህተት ተከስቷል");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h1 className="mb-4 font-display text-2xl font-bold">{existing ? "ጨዋታ አስተካክል" : t.createGame}</h1>
      <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2"><Label>ርዕስ</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></div>
        <div className="md:col-span-2"><Label>መግለጫ</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} /></div>
        <div className="md:col-span-2"><Label>ሽልማት</Label><Input value={f.prize_description} onChange={(e) => setF({ ...f, prize_description: e.target.value })} /></div>
        <div><Label>የቲኬት ዋጋ (ብር)</Label><Input type="number" value={f.ticket_price} onChange={(e) => setF({ ...f, ticket_price: e.target.value as any })} /></div>
        <div><Label>ጠቅላላ ቲኬቶች</Label><Input type="number" value={f.total_tickets} onChange={(e) => setF({ ...f, total_tickets: e.target.value as any })} /></div>
        <div><Label>የአካውንት ስም</Label><Input value={f.payment_account_name} onChange={(e) => setF({ ...f, payment_account_name: e.target.value })} /></div>
        <div><Label>የአካውንት ቁጥር</Label><Input value={f.payment_account_number} onChange={(e) => setF({ ...f, payment_account_number: e.target.value })} /></div>
        <div><Label>ባንክ</Label><Input value={f.payment_bank} onChange={(e) => setF({ ...f, payment_bank: e.target.value })} /></div>
        <div><Label>ሁኔታ</Label>
          <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="draft">ረቂቅ</SelectItem><SelectItem value="active">ንቁ</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>መጀመሪያ</Label><Input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} /></div>
        <div><Label>መጨረሻ (አማራጭ)</Label><Input type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>ሽፋን ምስል</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        <div className="md:col-span-2"><Button type="submit" disabled={busy}>{busy ? t.loading : t.save}</Button></div>
      </form>
    </Card>
  );
}
