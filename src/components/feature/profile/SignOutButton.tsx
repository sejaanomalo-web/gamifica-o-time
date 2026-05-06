"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const onSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Saiu.");
    router.push("/login");
    router.refresh();
  };
  return (
    <button
      onClick={onSignOut}
      className="btn-pill btn-ghost"
      style={{ height: 42, padding: "0 22px", fontSize: 12 }}
    >
      <LogOut size={14} className="mr-1" />
      Sair da conta
    </button>
  );
}
