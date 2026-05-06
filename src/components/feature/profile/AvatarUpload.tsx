"use client";

// Upload de foto de perfil. Cliente comprime imagem (640px max, qualidade 0.85)
// pra reduzir custo de storage, sobe direto pro bucket `avatars` do Supabase
// usando a sessão autenticada do usuário (RLS garante que ele só escreve na
// própria pasta), depois chama PATCH /api/profile pra persistir avatarUrl no
// public.User.

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
  initialUrl: string | null;
  initials: string;
  authUserId: string;
}

const MAX_DIM = 640;
const QUALITY = 0.85;
const MAX_BYTES = 5 * 1024 * 1024;

async function compress(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Imagem inválida."));
      i.src = url;
    });
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas não disponível.");
    // Preenche fundo preto pra evitar canto transparente em jpeg
    ctx.fillStyle = "#070709";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Compressão falhou."))),
        "image/jpeg",
        QUALITY,
      ),
    );
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarUpload({ initialUrl, initials, authUserId }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-selecionar o mesmo arquivo
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error("Arquivo precisa ser uma imagem.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Imagem muito grande. Máximo 5 MB.");
      return;
    }

    setBusy(true);
    try {
      const blob = await compress(file);
      const supabase = createClient();
      const path = `${authUserId}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "3600",
        });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`; // cache-bust

      const res = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      if (!res.ok) throw new Error(await res.text());

      setUrl(publicUrl);
      toast.success("Foto atualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={busy ? undefined : onPick}
        className="relative cursor-pointer rounded-full"
        style={{
          width: 96,
          height: 96,
          background: "rgba(201, 149, 58, 0.10)",
          boxShadow:
            "inset 0 0 0 1.5px #C9953A, 0 0 24px rgba(201,149,58,0.30), 0 8px 32px -16px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#C9953A]">
            {initials}
          </div>
        )}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity rounded-full"
          style={{
            background: "rgba(0, 0, 0, 0.55)",
            opacity: busy ? 1 : 0,
          }}
        >
          <Loader2 className="text-[#C9953A] animate-spin" size={28} />
        </div>
        <div
          className="absolute bottom-0 right-0 rounded-full flex items-center justify-center"
          style={{
            width: 30,
            height: 30,
            background: "#C9953A",
            color: "#1a1410",
            boxShadow: "0 0 16px rgba(201,149,58,0.55), inset 0 1px 0 rgba(255,255,255,0.30)",
          }}
        >
          <Camera size={14} />
        </div>
      </motion.div>

      <div>
        <button
          type="button"
          onClick={onPick}
          disabled={busy}
          className="btn-pill btn-ghost"
          style={{ height: 38, padding: "0 18px", fontSize: 12 }}
        >
          {busy ? "Enviando…" : url ? "Trocar foto" : "Adicionar foto"}
        </button>
        <p className="text-faint text-xs mt-2 max-w-[220px] leading-relaxed">
          JPG, PNG ou WEBP até 5 MB. Comprimida e cropada automaticamente.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
