import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

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
  name: "get_my_profile",
  title: "Get my FlexCard profile",
  description:
    "Return the signed-in user's FlexCard profile (name, slug, kind, sector, city, company, title, premium status).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const email = ctx.getUserEmail();
    const sb = supabaseForUser(ctx);
    const query = sb
      .from("profiles")
      .select(
        "id, slug, email, kind, first_name, last_name, title, company, sector, city, has_premium, template_id, created_at",
      )
      .limit(1);
    const { data, error } = email
      ? await query.eq("email", email.toLowerCase()).maybeSingle()
      : await query.eq("id", ctx.getUserId()).maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "No FlexCard profile is linked to this account yet. Sign in to the app and create your card first.",
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { profile: data },
    };
  },
});
