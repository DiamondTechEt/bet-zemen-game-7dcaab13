import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const VERIFIER_BASE = "https://verifyapi.leulzenebe.pro";

const inputSchema = z.object({
  ticket_id: z.string().uuid(),
});

type VerifierResp = {
  success?: boolean;
  amount?: number | string;
  message?: string;
  data?: { amount?: number | string };
};

function endpointFor(bank: string) {
  switch (bank) {
    case "CBE": return "/verify-cbe";
    case "Telebirr": return "/verify-telebirr";
    case "Dashen": return "/verify-dashen";
    case "Abyssinia": return "/verify-abyssinia";
    case "CBEBirr": return "/verify-cbebirr";
    case "MPesa": return "/verify-mpesa";
    default: return null;
  }
}

function buildBody(bank: string, ref: string, suffix: string | null, phone: string | null) {
  switch (bank) {
    case "CBE":
    case "Abyssinia":
      return { reference: ref, suffix };
    case "Telebirr":
    case "Dashen":
      return { reference: ref };
    case "CBEBirr":
      return { receiptNumber: ref, phoneNumber: phone };
    case "MPesa":
      return { reference: ref, phoneNumber: phone };
    default:
      return { reference: ref };
  }
}

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const apiKey = process.env.VERIFIER_API_KEY;
    if (!apiKey) return { success: false, reason: "no_api_key" as const };

    // Load ticket + game (admin client to bypass RLS once we've checked ownership)
    const { data: ticket, error: terr } = await supabaseAdmin
      .from("tickets")
      .select("id, user_id, game_id, payment_bank, payment_reference, payment_suffix, payment_phone, status")
      .eq("id", data.ticket_id)
      .maybeSingle();

    if (terr || !ticket) return { success: false, reason: "not_found" as const };
    if (ticket.user_id !== userId) return { success: false, reason: "forbidden" as const };
    if (ticket.status === "verified") return { success: true, ticket_number: null, already: true };

    const { data: game } = await supabaseAdmin
      .from("games")
      .select("id, ticket_price")
      .eq("id", ticket.game_id)
      .single();

    if (!game) return { success: false, reason: "game_not_found" as const };

    const endpoint = endpointFor(ticket.payment_bank);
    if (!endpoint) return { success: false, reason: "bad_bank" as const };

    const body = buildBody(
      ticket.payment_bank,
      ticket.payment_reference,
      ticket.payment_suffix,
      ticket.payment_phone,
    );

    let respJson: VerifierResp = {};
    let ok = false;
    try {
      const r = await fetch(`${VERIFIER_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(body),
      });
      ok = r.ok;
      respJson = (await r.json().catch(() => ({}))) as VerifierResp;
    } catch (e) {
      console.error("verifier api error", e);
      return { success: false, reason: "api_error" as const };
    }

    const amount = Number(respJson.amount ?? respJson.data?.amount ?? 0);
    const expected = Number(game.ticket_price);

    if (!ok || !amount) {
      return { success: false, reason: "not_verified" as const };
    }
    if (Math.abs(amount - expected) > 1) {
      await supabaseAdmin.from("tickets").update({
        status: "rejected",
        rejection_reason: `የክፍያ መጠን ከቲኬት ዋጋ ጋር አይዛመድም (${amount} vs ${expected})`,
      }).eq("id", ticket.id);
      return { success: false, reason: "amount_mismatch" as const, amount };
    }

    // Atomic ticket number assignment
    const { data: tn, error: rpcErr } = await supabaseAdmin.rpc("assign_ticket_number", {
      _ticket_id: ticket.id,
      _verified_amount: amount,
    });
    if (rpcErr) {
      console.error("assign_ticket_number error", rpcErr);
      return { success: false, reason: "assign_failed" as const };
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: ticket.user_id,
      message: `ቲኬትዎ ተረጋግጧል። የቲኬት ቁጥር: ${tn}`,
      type: "success",
    });

    return { success: true as const, ticket_number: tn as number };
  });
