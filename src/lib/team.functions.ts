import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InviteInput = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["admin", "moderator", "commercial", "coordinator", "partner"]),
});

export const listTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: canAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!canAdmin) throw new Error("FORBIDDEN");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, created_at")
      .in("role", ["admin", "moderator", "commercial", "coordinator", "partner"]);

    if (!roles?.length) return [];
    const ids = Array.from(new Set(roles.map((r) => r.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, email, slug")
      .in("id", ids);

    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return roles.map((r) => ({
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      profile: byId.get(r.user_id) ?? null,
    }));
  });

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: canAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!canAdmin) throw new Error("FORBIDDEN");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tempPassword =
      "Flex-" + Math.random().toString(36).slice(2, 8) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

    let userId: string | null = null;
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name: data.firstName, last_name: data.lastName },
    });
    if (createErr) {
      // Existing user — recover id
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const found = list?.users?.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
      if (!found) throw new Error(createErr.message);
      userId = found.id;
    } else {
      userId = created.user?.id ?? null;
    }
    if (!userId) throw new Error("USER_ID_MISSING");

    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role }).select();

    return { ok: true, userId, tempPassword: createErr ? null : tempPassword };
  });

export const revokeTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), role: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: canAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!canAdmin) throw new Error("FORBIDDEN");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    return { ok: true };
  });
