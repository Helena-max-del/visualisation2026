export const SPEED_OPTIONS = [
  {
    id: 'all',
    label: 'All speeds',
    note: 'Use the full public network as the local availability baseline.',
    radiusKm: 2.5,
  },
  {
    id: 'local',
    label: '0-49 kW',
    note: 'Focus on neighbourhood and destination charging for routine top-ups.',
    radiusKm: 1.8,
  },
  {
    id: 'rapid',
    label: '50-149 kW',
    note: 'Highlight rapid chargers suited to shorter dwell times and mid-journey use.',
    radiusKm: 5,
  },
  {
    id: 'ultra',
    label: '150 kW+',
    note: 'Prioritise high-power hubs for drivers who need the fastest turnover.',
    radiusKm: 8,
  },
]

export const SPEED_STYLES = {
  local: { label: '0-49 kW', color: '#c8742c' },
  rapid: { label: '50-149 kW', color: '#4f7af2' },
  ultra: { label: '150 kW+', color: '#163a70' },
}

export const TRAVEL_SPEED_OPTIONS = [
  {
    id: '15',
    label: '15 km/h',
    kmPerHour: 15,
    note: 'Short urban trips and slower local movement.',
  },
  {
    id: '20',
    label: '20 km/h',
    kmPerHour: 20,
    note: 'A mid-range city travel assumption.',
  },
  {
    id: '25',
    label: '25 km/h',
    kmPerHour: 25,
    note: 'A faster local urban journey assumption.',
  },
]

export const TIME_BAND_OPTIONS = [
  {
    id: 'min5',
    label: 'Within 5 min',
    minutes: 5,
    color: '#d96fa8',
  },
  {
    id: 'min10',
    label: 'Within 10 min',
    minutes: 10,
    color: '#58b7ff',
  },
  {
    id: 'min15',
    label: 'Within 15 min',
    minutes: 15,
    color: '#efc34f',
  },
]

export function getSpeedOption(speedFilter) {
  return SPEED_OPTIONS.find((option) => option.id === speedFilter) || SPEED_OPTIONS[0]
}

export function getTravelSpeedOption(speedId) {
  return TRAVEL_SPEED_OPTIONS.find((option) => option.id === speedId) || TRAVEL_SPEED_OPTIONS[0]
}

export function getTravelBandRadiusKm(minutes, kmPerHour) {
  return Number(((minutes * kmPerHour) / 60).toFixed(2))
}
