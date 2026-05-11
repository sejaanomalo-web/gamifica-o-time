// Sistema antigo foi substituído pelo PA. Esta rota redireciona pro
// dashboard PA. Mantida pra não quebrar links/bookmarks antigos.

import { redirect } from "next/navigation";

export default function DashboardLegacyRedirect() {
  redirect("/pa");
}
