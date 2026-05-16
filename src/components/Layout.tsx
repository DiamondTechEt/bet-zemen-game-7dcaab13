import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, LogOut, Menu, X, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const load = async () => {
      const { count } = await supabase.from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("is_read", false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase.channel("nav-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  const links = (
    <>
      <Link to="/" className="hover:text-gold transition" onClick={() => setOpen(false)}>{t.home}</Link>
      {user && <Link to="/my-tickets" className="hover:text-gold transition" onClick={() => setOpen(false)}>{t.myTickets}</Link>}
      {user && <Link to="/dashboard" className="hover:text-gold transition" onClick={() => setOpen(false)}>{t.dashboard}</Link>}
      <Link to="/how-it-works" className="hover:text-gold transition" onClick={() => setOpen(false)}>{t.howItWorks}</Link>
      {profile?.is_admin && <Link to="/admin/dashboard" className="text-gold font-semibold" onClick={() => setOpen(false)}>{t.admin}</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-elegant">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-gold-foreground">
            <Ticket className="h-5 w-5" />
          </div>
          <span className="font-display">{t.appName}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">{links}</nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/my-tickets" className="relative">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-gold-foreground">
                    {unread}
                  </span>
                )}
              </Link>
              <span className="text-sm opacity-90">{profile?.full_name?.split(" ")[0]}</span>
              <Button size="sm" variant="secondary" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4" />{t.logout}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button size="sm" variant="secondary">{t.login}</Button></Link>
              <Link to="/register"><Button size="sm" className="bg-gold text-gold-foreground hover:opacity-90">{t.register}</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <div className={cn("md:hidden overflow-hidden bg-primary/95 transition-all", open ? "max-h-96" : "max-h-0")}>
        <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
          {links}
          {user ? (
            <Button variant="secondary" onClick={handleLogout}><LogOut className="mr-1 h-4 w-4" />{t.logout}</Button>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="flex-1"><Button variant="secondary" className="w-full">{t.login}</Button></Link>
              <Link to="/register" className="flex-1"><Button className="w-full bg-gold text-gold-foreground">{t.register}</Button></Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-primary text-primary-foreground/90">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-lg font-bold text-gold">{t.appName}</h3>
          <p className="text-sm opacity-80">{t.tagline}</p>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">አስፈላጊ ሊንኮች</h4>
          <ul className="space-y-1 text-sm opacity-80">
            <li><Link to="/about" className="hover:text-gold">{t.about}</Link></li>
            <li><Link to="/how-it-works" className="hover:text-gold">{t.howItWorks}</Link></li>
            <li><Link to="/terms" className="hover:text-gold">{t.terms}</Link></li>
            <li><Link to="/contact" className="hover:text-gold">{t.contact}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">አግኙን</h4>
          <p className="text-sm opacity-80">አዲስ አበባ፣ ኢትዮጵያ</p>
          <p className="text-sm opacity-80">support@ticketwin.et</p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} {t.appName}. ሁሉም መብቶች የተጠበቁ ናቸው።
      </div>
    </footer>
  );
}

export function MobileBottomNav() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t bg-card md:hidden">
      <Link to="/" className="flex flex-col items-center py-2 text-xs">
        <Ticket className="h-5 w-5" />{t.home}
      </Link>
      <Link to="/my-tickets" className="flex flex-col items-center py-2 text-xs">
        <Bell className="h-5 w-5" />{t.myTickets}
      </Link>
      <Link to="/dashboard" className="flex flex-col items-center py-2 text-xs">
        <LogOut className="h-5 w-5 rotate-180" />{t.dashboard}
      </Link>
    </nav>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
