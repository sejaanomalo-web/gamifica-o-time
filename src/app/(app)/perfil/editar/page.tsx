import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { requireAppUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "@/components/feature/profile/EditProfileForm";

export default async function EditarPerfilPage() {
  const user = await requireAppUser();
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-2xl mx-auto w-full">
      <Reveal>
        <Link
          href="/perfil"
          className="label-caps label-caps-muted hover:text-[#C9953A] inline-block transition-colors"
        >
          ← Perfil
        </Link>
        <h1
          className="mt-5 text-white"
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.25rem, 7vw, 3rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          Editar<br />
          <span
            className="text-[#C9953A]"
            style={{
              fontWeight: 300,
              fontStyle: "italic",
              textTransform: "lowercase",
              letterSpacing: "-0.02em",
            }}
          >
            perfil.
          </span>
        </h1>
      </Reveal>

      <EditProfileForm
        initialName={user.name}
        initialEmail={user.email}
        initialAvatarUrl={user.avatarUrl}
        authUserId={authUser?.id ?? ""}
      />
    </div>
  );
}
