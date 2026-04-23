function formatAnchorCoordinates(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  return `${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}`
}

export default function ResultPanel({
  city,
  summary,
  anchor,
  travelBands = [],
  travelSpeed,
  stationProfile,
  cityContext,
  panelHeight,
}) {
  const desktopHeight = panelHeight && typeof window !== 'undefined' && window.innerWidth > 860
    ? `${panelHeight}px`
    : undefined
  const anchorCoordinates = formatAnchorCoordinates(anchor?.coordinates)

  if (!summary) {
    return (
      <section className="part3-result-card glass-card" style={{ height: desktopHeight }}>
        <p className="part3-result-empty">Loading neighbourhood assessment...</p>
      </section>
    )
  }

  return (
    <section className="part3-result-card glass-card" style={{ height: desktopHeight }}>
      <div className="part3-result-header">
        <div>
          <p className="part3-control-label">Neighbourhood assessment</p>
          <h3>{anchor?.label || `${city?.label || 'City'} focus area`}</h3>
        </div>

        <div className={`part3-score-pill is-${summary.scoreBand}`}>
          <span>{summary.scoreBandLabel}</span>
          <strong>{summary.score}</strong>
        </div>
      </div>

      <p className="part3-result-lead">{summary.headline}</p>

      <div className="part3-time-band-section">
        <div className="part3-nearby-header">
          <h4>Travel-time reach</h4>
          <span>
            {travelSpeed?.label || '15 km/h'}
            {anchorCoordinates ? ` | ${anchorCoordinates}` : ''}
          </span>
        </div>

        <div className="part3-time-band-list">
          {travelBands.map((band) => (
            <article key={band.id} className={`part3-time-band-card is-${band.id}`}>
              <div className="part3-time-band-card__head">
                <span>{band.label}</span>
                <i className="part3-time-band-card__dot" style={{ background: band.color }} />
              </div>
              <strong>{band.countLabel}</strong>
              <p>{band.note}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="part3-stat-grid">
        <article className="part3-stat-card">
          <span>Within catchment</span>
          <strong>{summary.visibleCountLabel}</strong>
          <p>{summary.visibleCountNote}</p>
        </article>

        <article className="part3-stat-card">
          <span>Nearest match</span>
          <strong>{summary.nearestLabel}</strong>
          <p>{summary.nearestNote}</p>
        </article>

        <article className="part3-stat-card">
          <span>Rapid fallback</span>
          <strong>{summary.rapidFallbackLabel}</strong>
          <p>{summary.rapidFallbackNote}</p>
        </article>

        <article className="part3-stat-card">
          <span>Provider mix</span>
          <strong>{summary.operatorCountLabel}</strong>
          <p>{summary.operatorCountNote}</p>
        </article>
      </div>

      <div className="part3-interpretation-card">
        <p className="part3-interpretation-card__label">What this means</p>
        <p>{summary.interpretation}</p>
      </div>

      <div className="part3-station-profile">
        <div className="part3-nearby-header">
          <h4>{stationProfile?.title || 'Closest station profile'}</h4>
          <span>{stationProfile?.distanceLabel || 'Neighbourhood reference'}</span>
        </div>

        {stationProfile ? (
          <>
            <div className="part3-station-profile__headline">
              <strong>{stationProfile.name}</strong>
              <p>{stationProfile.subtitle}</p>
            </div>

            <div className="part3-tag-row">
              {stationProfile.tags.map((tag) => (
                <span key={tag} className="part3-tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="part3-station-grid">
              {stationProfile.stats.map((stat) => (
                <article key={stat.label} className="part3-station-stat">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>

            <p className="part3-station-note">{stationProfile.note}</p>
          </>
        ) : (
          <p className="part3-nearby-empty">Pick a station or click a neighbourhood to reveal a more detailed site profile.</p>
        )}
      </div>

      <div className="part3-nearby-section">
        <div className="part3-nearby-header">
          <h4>Closest options from this point</h4>
          <span>{summary.catchmentLabel}</span>
        </div>

        {summary.nearbyStations.length ? (
          <div className="part3-nearby-list">
            {summary.nearbyStations.map((station) => (
              <article key={station.id} className="part3-nearby-item">
                <div>
                  <strong>{station.name}</strong>
                  <p>
                    {station.operator}
                    {station.postcode ? ` | ${station.postcode}` : ''}
                  </p>
                </div>

                <div className="part3-nearby-item__meta">
                  <span>{station.distanceLabel}</span>
                  <span>{station.speedLabel}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="part3-nearby-empty">No stations in the current speed band fall inside the active catchment.</p>
        )}
      </div>

      <div className="part3-city-context">
        <div className="part3-nearby-header">
          <h4>{city?.label} data coverage</h4>
          <span>What the current source can describe</span>
        </div>
        <div className="part3-station-grid">
          {cityContext.map((stat) => (
            <article key={stat.label} className="part3-station-stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

