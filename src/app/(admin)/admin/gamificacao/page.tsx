export default function GamificacaoPage() {
  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-4xl mx-auto w-full">
      <span className="label-caps mb-3 block">Admin · Regras</span>
      <h1
        className="text-white mb-4"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2.25rem, 6vw, 2.75rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Gami<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          ficação.
        </span>
      </h1>
      <p className="text-mid text-sm mb-10 max-w-md">
        Configurações da temporada, regras de pontos e loja. UI completa em
        build seguinte.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Pontos",
            desc: "Regras de XP por meta batida, multiplicadores de prazo, bônus de temporada.",
          },
          { title: "Temporadas", desc: "Atual, próxima, histórico." },
          {
            title: "Loja",
            desc: "Itens, custos em XP, estoque, aprovação de resgates.",
          },
        ].map((s) => (
          <div key={s.title} className="ano-card p-6">
            <span className="label-caps mb-3 block">{s.title}</span>
            <p className="text-white text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
