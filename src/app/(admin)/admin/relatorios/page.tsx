export default function RelatoriosPage() {
  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-5xl mx-auto w-full">
      <h1 className="text-h2 uppercase text-anomalo-white mb-2">Relatórios.</h1>
      <p className="text-anomalo-sand text-sm mb-8">
        KPIs de batimento, DAU/MAU, leaderboards históricos.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-anomalo-gold-hair border border-anomalo-gold-hair">
        {[
          { label: "Taxa de batimento", value: "—" },
          { label: "DAU", value: "—" },
          { label: "MAU", value: "—" },
          { label: "Tempo médio", value: "—" },
        ].map((s) => (
          <div key={s.label} className="bg-anomalo-black p-5 text-center">
            <span className="label-caps text-anomalo-sand block mb-2">{s.label}</span>
            <span className="font-black text-anomalo-white text-2xl">{s.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-anomalo-muted text-xs">
        Em breve: gráficos Recharts (XP por colaborador, retenção, distribuição por área).
      </p>
    </div>
  );
}
