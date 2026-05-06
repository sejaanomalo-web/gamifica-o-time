export default function RelatoriosPage() {
  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <span className="label-caps mb-3 block">Admin · Métricas</span>
      <h1
        className="text-white"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2.25rem, 6vw, 2.75rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Rela<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          tórios.
        </span>
      </h1>
      <p className="text-mid text-sm mt-4 max-w-md mb-10">
        KPIs de batimento, DAU/MAU, leaderboards históricos.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Taxa de batimento", value: "—" },
          { label: "DAU", value: "—" },
          { label: "MAU", value: "—" },
          { label: "Tempo médio", value: "—" },
        ].map((s) => (
          <div key={s.label} className="ano-card-flat p-5 text-center">
            <span className="label-caps label-caps-muted block mb-3">{s.label}</span>
            <span className="text-mono text-white" style={{ fontSize: 24, fontWeight: 700 }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-8 text-faint text-xs">
        Em breve: gráficos Recharts (XP por colaborador, retenção, distribuição por área).
      </p>
    </div>
  );
}
