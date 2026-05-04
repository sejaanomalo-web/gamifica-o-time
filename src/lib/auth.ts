import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAppUser() {
  const authUser = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { email: authUser.email! } });
  if (!dbUser) redirect("/login");
  return dbUser;
}

export async function requireAdmin() {
  const dbUser = await requireAppUser();
  if (dbUser.role !== "ADMIN") redirect("/dashboard");
  return dbUser;
}
