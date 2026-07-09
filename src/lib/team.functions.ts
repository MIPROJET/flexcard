import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["admin", "moderator", "commercial", "coordinator", "partner", "imprimeur"] as const;

const InviteInput = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(ROLES),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("FORBIDDEN");
}

export const listTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await (supabaseAdmin as any)
      .from("user_roles")
      .select("user_id, role, granted_at")
      .in("role", ROLES);

    const rows = (roles ?? []) as Array<{ user_id: string; role: string; granted_at: string }>;
    if (!rows.length) return [];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, email, slug")
      .in("id", ids);

    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return rows.map((r) => ({
      user_id: r.user_id,
      role: r.role,
      granted_at: r.granted_at,
      profile: byId.get(r.user_id) ?? null,
    }));
  });

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tempPassword =
      "Flex-" + Math.random().toString(36).slice(2, 8) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

    let userId: string | null = null;
    let created = false;
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name: data.firstName, last_name: data.lastName },
    });
    if (createErr) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const found = list?.users?.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
      if (!found) throw new Error(createErr.message);
      userId = found.id;
    } else {
      userId = newUser.user?.id ?? null;
      created = true;
    }
    if (!userId) throw new Error("USER_ID_MISSING");

    await (supabaseAdmin as any)
      .from("user_roles")
      .insert({ user_id: userId, role: data.role })
      .select();

    return { ok: true, userId, tempPassword: created ? tempPassword : null };
  });

export const revokeTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), role: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    return { ok: true };
  });
