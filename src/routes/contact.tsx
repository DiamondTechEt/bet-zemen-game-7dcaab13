import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({ component: Contact });

function Contact() {
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(f);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("መልዕክትዎ ተልኳል!"); setF({ name: "", email: "", phone: "", message: "" }); }
  };
  return (
    <PageShell><div className="container mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-6 font-display text-4xl font-bold">አግኙን</h1>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-3">
          <div><Label>ስም</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
          <div><Label>ኢሜይል</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>ስልክ</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label>መልዕክት</Label><Textarea rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required /></div>
          <Button type="submit" disabled={busy}>{busy ? "በመላክ ላይ..." : "ላክ"}</Button>
        </form>
      </Card>
    </div></PageShell>
  );
}
