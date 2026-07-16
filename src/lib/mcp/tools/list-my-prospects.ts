import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_my_prospects",
  title: "List my prospects",
  description:
    "List prospects (people who scanned the signed-in user's FlexCard). Returns scanner phone, contact name/email if known, first/last visit dates and visit count.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50)
      .describe("Maximum number of prospects to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const email = ctx.getUserEmail();
    const profileQuery = sb.from("profiles").select("id").limit(1);
    const { data: profile, error: profileErr } = email
      ? await profileQuery.eq("email", email.toLowerCase()).maybeSingle()
      : await profileQuery.eq("id", ctx.getUserId()).maybeSingle();
    if (profileErr) {
      return { content: [{ type: "text", text: profileErr.message }], isError: true };
    }
    if (!profile) {
      return { content: [{ type: "text", text: "No FlexCard profile linked to this account." }] };
    }
    const { data, error } = await sb
      .from("prospects")
      .select(
        "scanner_phone, contact_name, contact_email, first_scan_at, last_visit_at, visits",
      )
      .eq("profile_id", profile.id)
      .order("last_visit_at", { ascending: false })
      .limit(limit);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [
        { type: "text", text: `${data?.length ?? 0} prospects\n${JSON.stringify(data, null, 2)}` },
      ],
      structuredContent: { prospects: data ?? [] },
    };
  },
});
