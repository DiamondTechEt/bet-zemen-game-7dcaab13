import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/games/new")({
  component: () => {
    const nav = useNavigate();
    useEffect(() => { nav({ to: "/admin/games", search: { create: true } as any, replace: true }); }, [nav]);
    return null;
  },
});
