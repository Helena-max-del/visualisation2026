export default function LoadingState({ title = 'Loading…', description = '' }) {
  return (
    <div className="glass-panel" style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginTop: 0, marginBottom: 12, color: 'white' }}>{title}</h2>
      {description ? <p style={{ margin: 0, color: 'rgba(255,255,255,0.68)' }}>{description}</p> : null}
    </div>
  )
}
