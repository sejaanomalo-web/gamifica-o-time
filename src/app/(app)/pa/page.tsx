// /pa redireciona pra /pa/time — a aba "Time" virou a tela padrão
// do app pra todos os colaboradores. O conteúdo da Home antiga
// (saudação + posição + nível + barra) agora vive no topo de /pa/time.

import { redirect } from "next/navigation";

export default function PaIndexRedirect() {
  redirect("/pa/time");
}
