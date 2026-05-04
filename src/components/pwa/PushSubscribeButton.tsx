"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushSubscribeButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub));
  }, []);

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Permissão negada.");
        return;
      }
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        toast.error("VAPID não configurado.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error(await res.text());
      setSubscribed(true);
      toast.success("Notificações ativadas.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falhou.");
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={subscribe}
      disabled={subscribed}
      className="flex items-center gap-2 label-caps px-4 py-2.5 border border-anomalo-gold-hair text-anomalo-gold disabled:opacity-50"
    >
      {subscribed ? <BellOff size={14} /> : <Bell size={14} />}
      {subscribed ? "Notificações ligadas" : "Ativar notificações"}
    </button>
  );
}
