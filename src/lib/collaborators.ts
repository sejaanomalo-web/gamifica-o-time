// Lista de IDs de colaboradores ativos. ADMIN não compete e não conta
// no ranking, no dashboard de equipe nem nas atividades ao vivo.
// Centralizado aqui pra garantir consistência em todas as superfícies.

import { prisma } from "@/lib/prisma";

export async function getCollaboratorIds(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { role: "COLABORADOR" },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
