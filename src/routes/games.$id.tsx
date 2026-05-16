import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { verifyPayment } from "@/lib/verify.functions";
import { PageShell } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { t, banks, formatETB } from "@/lib/i18n";
import { toast } from "sonner";
import { Trophy, Building2, CreditCard, Upload, CheckCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/games/$id")({ component: GameDetail });

function GameDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const verify = useServerFn(verifyPayment);

  const { data: game, refetch } = useQuery({
    queryKey: ["game", id],
    queryFn: async () => {
      const { data } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const [open, setOpen] = useState(false);
  const [bank, setBank] = useState("");
  const [reference, setReference] = useState("");
  const [suffix, setSuffix] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; ticket?: number; msg?: string } | null>(null);

  if (!game) return <PageShell><div className="container mx-auto py-12 px-4">{t.loading}</div></PageShell>;

  const pct = (game.tickets_sold / game.total_tickets) * 100;
  const needsSuffix = bank === "CBE" || bank === "Abyssinia";
  const needsPhone = bank === "CBEBirr" || bank === "MPesa";

  const handleBuy = () => {
    if (!user) { navigate({ to: "/login" }); return; }
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bank || !reference) { toast.error("ሁሉንም መስኮች ይሙሉ"); return; }
    if (needsSuffix && suffix.length < 4) { toast.error("የመጨረሻ አሃዞች ያስፈልጋሉ"); return; }
    if (needsPhone && !phone) { toast.error("ስልክ ቁጥር ያስፈልጋል"); return; }

    setSubmitting(true);

    // Check duplicate reference
    const { data: dup } = await supabase.from("tickets")
      .select("id").eq("game_id", game.id).eq("payment_reference", reference).maybeSingle();
    if (dup) { toast.error("ይህ የግብይት መለያ አስቀድሞ ጥቅም ላይ ውሏል"); setSubmitting(false); return; }

    // Upload receipt if any
    let receipt_url: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, file);
      if (!upErr) receipt_url = path;
    }

    // Insert ticket
    const { data: tk, error } = await supabase.from("tickets").insert({
      game_id: game.id,
      user_id: user!.id,
      payment_bank: bank,
      payment_reference: reference,
      payment_suffix: needsSuffix ? suffix : null,
      payment_phone: needsPhone ? phone : null,
      receipt_image_url: receipt_url,
      status: "payment_uploaded",
    }).select().single();

    if (error) { toast.error(error.message); setSubmitting(false); return; }

    // Call verifier
    try {
      const r = await verify({ data: { ticket_id: tk.id } });
      if (r.success) {
        setResult({ ok: true, ticket: r.ticket_number ?? undefined });
        toast.success("ቲኬት ተረጋግጧል!");
      } else {
        setResult({ ok: false, msg: r.reason === "amount_mismatch" ? "የክፍያ መጠን አይዛመድም" : t.paymentPending });
        toast.warning("ራስ-ሰር ማረጋገጥ አልተቻለም");
      }
    } catch (e: any) {
      setResult({ ok: false, msg: t.paymentPending });
    }
    setSubmitting(false);
    refetch();
  };

  return (
    <PageShell>
      <div className="aspect-[3/1] w-full overflow-hidden bg-secondary">
        {game.game_image_url ? <img src={game.game_image_url} alt={game.title} className="h-full w-full object-cover" /> :
          <div className="flex h-full w-full items-center justify-center bg-gradient-hero"><Trophy className="h-24 w-24 text-gold/50" /></div>}
      </div>

      <div className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{game.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-lg"><Trophy className="h-5 w-5 text-gold" /> {game.prize_description}</p>
          <p className="mt-4 whitespace-pre-line text-muted-foreground">{game.description}</p>

          <Card className="mt-6 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><Building2 className="h-5 w-5 text-primary" /> {t.paymentInstructions}</h3>
            <p className="mb-3 text-sm">{t.sendExactly} <span className="font-bold text-primary">{formatETB(game.ticket_price)}</span></p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">{t.accountName}</span><span className="font-semibold">{game.payment_account_name}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">{t.accountNumber}</span><span className="font-mono font-semibold">{game.payment_account_number}</span></div>
              <div className="flex justify-between py-2"><span className="text-muted-foreground">{t.bank}</span><span className="font-semibold">{game.payment_bank}</span></div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-20 p-5 shadow-elegant">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t.ticketPrice}</p>
              <p className="my-2 font-display text-4xl font-bold text-primary">{formatETB(game.ticket_price)}</p>
            </div>
            <div className="my-4 space-y-1">
              <div className="flex justify-between text-xs"><span>{game.tickets_sold}/{game.total_tickets}</span><span>{Math.round(pct)}%</span></div>
              <Progress value={pct} />
            </div>
            <Button onClick={handleBuy} className="w-full bg-gold text-gold-foreground hover:opacity-90 shadow-gold" size="lg"
              disabled={game.status !== "active" || pct >= 100}>
              {game.status !== "active" ? "ዝግ" : pct >= 100 ? "ሞልቷል" : t.buyTicket}
            </Button>
            {game.status === "completed" && (
              <Link to="/games/$id/winner" params={{ id: game.id }}>
                <Button variant="outline" className="mt-2 w-full">አሸናፊውን ይመልከቱ</Button>
              </Link>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t.buyTicket}</DialogTitle></DialogHeader>
          {result ? (
            <div className="py-4 text-center">
              {result.ok ? (
                <>
                  <CheckCircle className="mx-auto h-16 w-16 text-success" />
                  <h3 className="mt-3 text-xl font-bold text-success">{t.paymentSuccess}</h3>
                  <div className="mx-auto mt-4 max-w-xs rounded-lg bg-gradient-gold p-4 text-gold-foreground shadow-gold">
                    <p className="text-xs opacity-80">{t.yourTicketNumber}</p>
                    <p className="font-mono text-4xl font-bold">#{result.ticket}</p>
                  </div>
                  <Button onClick={() => setOpen(false)} className="mt-4">ዝጋ</Button>
                </>
              ) : (
                <>
                  <Loader2 className="mx-auto h-12 w-12 text-warning" />
                  <p className="mt-3 text-muted-foreground">{result.msg}</p>
                  <Button onClick={() => setOpen(false)} className="mt-4">እሺ</Button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>{t.selectBank}</Label>
                <Select value={bank} onValueChange={setBank}>
                  <SelectTrigger><SelectValue placeholder={t.selectBank} /></SelectTrigger>
                  <SelectContent>{banks.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {bank && <>
                <div><Label>{t.referenceNumber}</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} required /></div>
                {needsSuffix && <div><Label>{t.accountSuffix}</Label><Input value={suffix} onChange={(e) => setSuffix(e.target.value)} maxLength={8} required /></div>}
                {needsPhone && <div><Label>{t.phoneNumber}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" required /></div>}
                <div>
                  <Label>{t.uploadReceipt}</Label>
                  <Input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.paymentVerifying}</> : t.confirmPurchase}
                </Button>
              </>}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
