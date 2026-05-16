import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/Layout";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Gamepad2, Users } from "lucide-react";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (loading) return;
    if (!profile) navigate({ to: "/login" });
    else if (!profile.is_admin) navigate({ to: "/dashboard" });
  }, [loading, profile, navigate]);

  if (loading || !profile?.is_admin) return <PageShell><div className="container py-12 px-4">{t.loading}</div></PageShell>;

  const items = [
    { to: "/admin/dashboard", label: "ዋና", icon: LayoutDashboard },
    { to: "/admin/games", label: t.manageGames, icon: Gamepad2 },
    { to: "/admin/players", label: t.managePlayers, icon: Users },
  ];

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2 border-b pb-2">
          {items.map((it) => (
            <Link key={it.to} to={it.to as any} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${loc.pathname.startsWith(it.to) ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
              <it.icon className="h-4 w-4" />{it.label}
            </Link>
          ))}
        </div>
        <Outlet />
      </div>
    </PageShell>
  );
}
