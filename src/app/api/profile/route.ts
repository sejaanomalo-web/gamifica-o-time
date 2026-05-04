// PATCH /api/profile — collaborator updates own name/email.
// RLS in Supabase enforces row-level isolation; here we double-check ownership via auth user.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
});

export async function PATCH(req: Request) {
  const user = await requireAppUser();
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { name, email } = parsed.data;

  if (email !== user.email) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email },
  });

  return NextResponse.json({ ok: true });
}
