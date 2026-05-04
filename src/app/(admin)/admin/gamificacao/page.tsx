export default function GamificacaoPage() {
  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-4xl mx-auto w-full">
      <h1 className="text-h2 uppercase text-anomalo-white mb-8">Gamificação.</h1>

      <p className="text-anomalo-sand text-sm mb-8">
        Configurações da temporada, badges e loja. UI completa em build seguinte.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Pontos", desc: "Regras de XP por meta batida, multiplicadores de prazo, bônus de temporada." },
          { title: "Badges", desc: "Catálogo de conquistas. Critério automático ou manual." },
          { title: "Temporadas", desc: "Atual, próxima, histórico." },
          { title: "Loja", desc: "Itens, custos em XP, estoque, aprovação de resgates." },
        ].map((s) => (
          <div key={s.title} className="border border-anomalo-gold-hair p-5">
            <span className="label-caps text-anomalo-gold mb-2 block">{s.title}</span>
            <p className="text-anomalo-white text-sm">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
