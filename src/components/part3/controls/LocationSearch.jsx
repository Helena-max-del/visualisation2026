export default function LocationSearch({
  query,
  onQueryChange,
  results = [],
  onSelectResult,
  onClear,
}) {
  const hasQuery = query.trim().length > 0

  return (
    <section className="part3-control-card part3-search-card glass-card">
      <div className="part3-control-copy">
        <p className="part3-control-label">Search</p>
        <h3>Jump to a named charger or known postcode</h3>
        <p>
          Search works against station names, operators, street labels, and postcodes that appear in the charging
          dataset.
        </p>
      </div>

      <div className="part3-search-shell">
        <input
          className="part3-search-input"
          type="search"
          value={query}
          placeholder="Try 'E14 5EW', 'Tesla', or 'Gridserve'"
          onChange={(event) => onQueryChange(event.target.value)}
          aria-label="Search station or postcode"
        />

        {hasQuery ? (
          <button type="button" className="part3-search-clear" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="part3-search-results" aria-live="polite">
        {hasQuery ? (
          results.length ? (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                className="part3-search-result"
                onClick={() => onSelectResult(result)}
              >
                <span className="part3-search-result__title">{result.properties.stationName}</span>
                <span className="part3-search-result__meta">
                  {result.properties.operatorLabel}
                  {result.properties.town ? ` | ${result.properties.town}` : ''}
                  {result.properties.postcode ? ` | ${result.properties.postcode}` : ''}
                </span>
                <span className="part3-search-result__badges">
                  <span>{result.properties.speedLabel}</span>
                  {result.properties.capacity ? <span>{result.properties.capacity} bays</span> : null}
                  {result.properties.statusId && result.properties.statusId !== 0 ? (
                    <span>{result.properties.statusLabel}</span>
                  ) : null}
                  {result.properties.feeLabel ? <span>{result.properties.feeLabel}</span> : null}
                </span>
              </button>
            ))
          ) : (
            <p className="part3-search-empty">No exact dataset match. Try clicking the map to assess a nearby area.</p>
          )
        ) : (
          <p className="part3-search-hint">Tip: the map also supports direct click-to-assess exploration.</p>
        )}
      </div>
    </section>
  )
}

