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

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile) {
      navigate({ to: profile.is_admin ? "/admin/dashboard" : "/dashboard" });
    }
  }, [user, profile, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!/^0?9\d{8}$/.test(p) && !/^9\d{8}$/.test(p) && p.length < 9) {
      toast.error("ትክክለኛ የስልክ ቁጥር ያስገቡ");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(p),
      password,
    });
    setLoading(false);
    if (error) { toast.error("ስልክ ቁጥር ወይም የይለፍ ቃል የተሳሳተ ነው"); return; }
    toast.success("በተሳካ ሁኔታ ገብተዋል");
  };

  return (
    <PageShell>
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6 shadow-elegant">
          <h1 className="mb-1 font-display text-2xl font-bold">{t.signIn}</h1>
          <p className="mb-6 text-sm text-muted-foreground">ቲኬቶችዎን ለማየት ይግቡ</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>{t.phone}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" required />
            </div>
            <div>
              <Label>{t.password}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.loading : t.signIn}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            {t.noAccount} <Link to="/register" className="font-semibold text-primary hover:underline">{t.signUp}</Link>
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
