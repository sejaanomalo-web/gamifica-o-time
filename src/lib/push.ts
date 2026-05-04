// web-push helpers. Lazy-loaded so non-push routes don't pull the lib.

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function configure() {
  if (configured) return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys missing. Run `npx web-push generate-vapid-keys`.");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:sejaanomalo@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  configure();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const code =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        if (code === 410 || code === 404) {
          await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } });
        }
      }
    }),
  );
}
