// Sistema antigo foi substituído pelo PA. Esta rota redireciona pro
// /pa/time (ranking + feed do PA).

import { redirect } from "next/navigation";

export default function RankingLegacyRedirect() {
  redirect("/pa/time");
}
