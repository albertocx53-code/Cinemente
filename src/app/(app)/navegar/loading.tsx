// Skeleton exibido enquanto a home carrega do banco
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando catálogo">
      <div className="skel" style={{ height: 'min(80svh, 760px)', borderRadius: 0 }} />
      <div style={{ display: 'grid', gap: 34, padding: '30px 0 60px' }}>
        {[0, 1, 2].map((r) => (
          <div key={r} style={{ padding: '0 var(--gutter)' }}>
            <div className="skel" style={{ width: 220, height: 20, marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="skel" style={{ flex: 'none', width: 'clamp(132px, 15.2vw, 232px)', aspectRatio: '2 / 3' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
