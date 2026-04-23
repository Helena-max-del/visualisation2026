const EARTH_RADIUS_KM = 6371

function toRadians(value) {
  return (value * Math.PI) / 180
}

export function haversineDistanceKm(from, to) {
  if (!from || !to) return Infinity

  const [fromLng, fromLat] = from
  const [toLng, toLat] = to

  const dLat = toRadians(toLat - fromLat)
  const dLng = toRadians(toLng - fromLng)
  const lat1 = toRadians(fromLat)
  const lat2 = toRadians(toLat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getFeatureBounds(features = []) {
  if (!features.length) return null

  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach((feature) => {
    const coordinates = feature?.geometry?.coordinates
    if (!Array.isArray(coordinates)) return

    const [lng, lat] = coordinates
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })

  if (![minLng, maxLng, minLat, maxLat].every(Number.isFinite)) return null

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

export function getFeatureCenter(features = [], fallback = [0, 0]) {
  const bounds = getFeatureBounds(features)
  if (!bounds) return fallback

  const [[minLng, minLat], [maxLng, maxLat]] = bounds
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
}

export function createCirclePolygon(center, radiusKm, steps = 60) {
  if (!center || !Number.isFinite(radiusKm) || radiusKm <= 0) {
    return { type: 'FeatureCollection', features: [] }
  }

  const [lng, lat] = center
  const latRadians = toRadians(lat)
  const latDegrees = radiusKm / 110.574
  const lngDegrees = radiusKm / (111.32 * Math.cos(latRadians || 1))
  const coordinates = []

  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2
    coordinates.push([
      lng + lngDegrees * Math.cos(angle),
      lat + latDegrees * Math.sin(angle),
    ])
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { radiusKm },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      },
    ],
  }
}
