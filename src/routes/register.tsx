import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { t, phoneToEmail, normalizePhone } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!/^0?9\d{8}$/.test(p)) { toast.error("ስልክ ቁጥር በ09 ይጀምር እና 10 አሃዝ ይሁን"); return; }
    if (password.length < 6) { toast.error("የይለፍ ቃል ቢያንስ 6 ቁምፊ ይሁን"); return; }
    if (password !== confirm) { toast.error("የይለፍ ቃሎች አይዛመዱም"); return; }
    if (fullName.trim().length < 2) { toast.error("ሙሉ ስም ያስፈልጋል"); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: phoneToEmail(p),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName.trim(), phone: p },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) toast.error("ይህ ስልክ ቁጥር አስቀድሞ ተመዝግቧል");
      else toast.error(error.message);
      return;
    }
    toast.success("በተሳካ ሁኔታ ተመዝግበዋል!");
  };

  return (
    <PageShell>
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6 shadow-elegant">
          <h1 className="mb-1 font-display text-2xl font-bold">{t.signUp}</h1>
          <p className="mb-6 text-sm text-muted-foreground">በቅርቡ ለመጀመር አዲስ አካውንት ይክፈቱ</p>
          <form onSubmit={submit} className="space-y-3">
            <div><Label>{t.fullName}</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
            <div><Label>{t.phone}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" required /></div>
            <div><Label>{t.password}</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
            <div><Label>{t.confirmPassword}</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? t.loading : t.signUp}</Button>
          </form>
          <p className="mt-4 text-center text-sm">
            {t.alreadyHaveAccount} <Link to="/login" className="font-semibold text-primary hover:underline">{t.signIn}</Link>
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
