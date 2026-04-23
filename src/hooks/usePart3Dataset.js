import { useEffect, useState } from 'react'
import { loadJson } from '../utils/loadData'

const B = import.meta.env.BASE_URL

export const PART3_CITY_CONFIGS = [
  {
    id: 'london',
    label: 'London',
    dataPaths: [
      `${B}data/part3/json/london_ne_ocm.json`,
      `${B}data/part3/json/london_nw_ocm.json`,
      `${B}data/part3/json/london_se_ocm.json`,
      `${B}data/part3/json/london_sw_ocm.json`,
      `${B}data/part3/json/london_west_n_ocm.json`,
      `${B}data/part3/json/london_west_s_ocm.json`,
      `${B}data/part3/json/london_central_ocm.json`,
      `${B}data/part3/json/london_hyde_park_ocm.json`,
    ],
    description:
      'A dense metropolitan case where neighbourhood charging, curbside provision, and rapid fallback all matter at once.',
  },
  {
    id: 'leeds',
    label: 'Leeds',
    dataPaths: [`${B}data/part3/json/leeds_ocm.json`],
    description:
      'A more intermediate network structure, useful for exploring how local chargers and destination hubs combine.',
  },
  {
    id: 'birmingham',
    label: 'Birmingham',
    dataPaths: [`${B}data/part3/json/birmingham_ocm.json`],
    description:
      'A polycentric urban case where corridor access and local neighbourhood availability need to be read together.',
  },
]

const STATUS_LABELS = {
  0: 'Status not stated',
  30: 'Temporarily unavailable',
  50: 'Operational',
  75: 'Partly operational',
  100: 'Planned',
  150: 'Removed',
}

const USAGE_TYPE_LABELS = {
  0: 'Access not stated',
  1: 'Public',
  2: 'Private / restricted',
  3: 'Private by arrangement',
  4: 'Public with membership',
  5: 'Public pay-to-use',
  6: 'Customers / visitors / staff',
  7: 'Residents only',
}

const CONNECTION_TYPE_LABELS = {
  1: '3-pin',
  2: 'CHAdeMO',
  25: 'Type 2',
  27: 'Tesla Supercharger',
  33: 'CCS',
  1036: 'Type 2 tethered',
}

const OPERATOR_ID_LABELS = {
  23: 'Tesla Supercharger',
  32: 'Pod Point',
  3296: 'InstaVolt',
  3392: 'Shell Recharge / Ubitricity',
  3737: 'Leeds City Council',
}

const PUBLIC_USAGE_TYPE_IDS = new Set([1, 4, 5, 6])

function blankFeatureCollection() {
  return { type: 'FeatureCollection', features: [] }
}

function parseMaxKw(value) {
  if (value == null || value === '') return null

  const matches = String(value).match(/(\d+(?:\.\d+)?)/g)
  if (!matches?.length) return null

  let numeric = Math.max(...matches.map((item) => Number(item) || 0))
  if (numeric > 1000) numeric /= 1000
  return Number(numeric.toFixed(1))
}

function normalisePostcode(value) {
  if (!value) return ''

  const compact = String(value).trim().toUpperCase().replace(/\s+/g, '')
  if (!compact) return ''
  if (compact.length > 5) return `${compact.slice(0, -3)} ${compact.slice(-3)}`
  return compact
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || '').replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(numeric) ? numeric : null
}

function isValidUkCoordinate(lng, lat) {
  return Number.isFinite(lng) && Number.isFinite(lat) && lng >= -8.5 && lng <= 2.5 && lat >= 49.5 && lat <= 61
}

function normaliseTown(value) {
  const label = String(value || '').trim()
  return label || null
}

function inferSpeedBand(maxKw) {
  if (maxKw == null) return 'local'
  if (maxKw >= 150) return 'ultra'
  if (maxKw >= 50) return 'rapid'
  return 'local'
}

function getSpeedLabel(speedBand, maxKw) {
  if (maxKw) return `${maxKw} kW`
  if (speedBand === 'ultra') return 'Ultra-rapid'
  if (speedBand === 'rapid') return 'Rapid'
  return 'Local / standard'
}

function getStatusLabel(statusId) {
  return STATUS_LABELS[statusId] || `Status ${statusId}`
}

function getUsageTypeLabel(usageTypeId) {
  return USAGE_TYPE_LABELS[usageTypeId] || `Usage type ${usageTypeId}`
}

function getConnectionTypeLabel(connectionTypeId) {
  return CONNECTION_TYPE_LABELS[connectionTypeId] || `Connector ${connectionTypeId}`
}

function inferOperatorLabel(row, stationName) {
  const title = stationName || ''

  if (OPERATOR_ID_LABELS[row.OperatorID]) return OPERATOR_ID_LABELS[row.OperatorID]
  if (/tesla|supercharger/i.test(title)) return 'Tesla Supercharger'
  if (/ubitricity|shell recharge/i.test(title)) return 'Shell Recharge / Ubitricity'
  if (/instavolt/i.test(title)) return 'InstaVolt'
  if (/pod point/i.test(title)) return 'Pod Point'
  if (/source london/i.test(title)) return 'Source London'
  if (/bp pulse|bp chargemaster/i.test(title)) return 'BP Pulse'
  if (/geniepoint/i.test(title)) return 'GeniePoint'
  if (/charge your car/i.test(title)) return 'Charge Your Car'
  if (/blink/i.test(title)) return 'Blink Charging'
  if (/ionity/i.test(title)) return 'IONITY'

  if (row.OperatorID != null) return `Provider ${row.OperatorID}`
  if (row.OperatorsReference) return `Provider ${row.OperatorsReference}`
  return 'Provider not listed'
}

function isPublicAccess(usageTypeId) {
  if (usageTypeId == null) return true
  return PUBLIC_USAGE_TYPE_IDS.has(Number(usageTypeId))
}

function hasTwentyFourSevenText(...values) {
  return values.some((value) => /24\s*\/\s*7|24\s*hours?|24hrs/i.test(String(value || '')))
}

function isFreeToUse(usageCost) {
  return /free|no charge|拢?\s*0(?:\.0+)?(?:\b|\/)/i.test(String(usageCost || ''))
}

function getConnectionSummary(connections = []) {
  const labels = []
  const quantities = new Map()

  connections.forEach((connection) => {
    const label = getConnectionTypeLabel(connection.ConnectionTypeID)
    if (!label) return

    const quantity = Number(connection.Quantity || 1) || 1
    quantities.set(label, (quantities.get(label) || 0) + quantity)
  })

  quantities.forEach((quantity, label) => {
    labels.push(quantity > 1 ? `${label} x${quantity}` : label)
  })

  return labels.length ? labels.join(', ') : 'Connector type not stated'
}

function getPointCapacity(row) {
  const directPoints = parseInteger(row.NumberOfPoints)
  if (directPoints) return directPoints

  const totalQuantity = (row.Connections || []).reduce((sum, connection) => {
    const quantity = parseInteger(connection.Quantity)
    return sum + (quantity || 1)
  }, 0)

  return totalQuantity || null
}

function getMaxPower(row) {
  const values = (row.Connections || [])
    .map((connection) => parseMaxKw(connection.PowerKW))
    .filter((value) => value != null)

  return values.length ? Math.max(...values) : null
}

function buildOcmDataset(city, payloads) {
  const features = []
  const seenIds = new Set()

  payloads.flat().forEach((row, index) => {
    const info = row.AddressInfo || {}
    const lat = Number(info.Latitude)
    const lng = Number(info.Longitude)
    const sourceId = row.ID || row.UUID || `${city.id}-${index}`

    if (!isValidUkCoordinate(lng, lat) || seenIds.has(sourceId)) return
    seenIds.add(sourceId)

    const stationName = info.Title || 'Unnamed charging station'
    const town = normaliseTown(info.Town)
    const postcode = normalisePostcode(info.Postcode)
    const maxKw = getMaxPower(row)
    const speedBand = inferSpeedBand(maxKw)
    const usageTypeId = row.UsageTypeID != null ? Number(row.UsageTypeID) : null
    const statusId =
      row.StatusTypeID != null
        ? Number(row.StatusTypeID)
        : row.Connections?.find((connection) => connection.StatusTypeID != null)?.StatusTypeID ?? 0
    const operatorLabel = inferOperatorLabel(row, stationName)
    const providerKey = String(row.OperatorID ?? row.OperatorsReference ?? operatorLabel)
    const capacity = getPointCapacity(row)
    const usageCost = row.UsageCost || null
    const accessComments = info.AccessComments || null
    const generalComments = row.GeneralComments || null
    const connectorSummary = getConnectionSummary(row.Connections || [])
    const alwaysOpen = hasTwentyFourSevenText(generalComments, accessComments)

    features.push({
      type: 'Feature',
      id: `ocm-${city.id}-${sourceId}`,
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        cityId: city.id,
        cityLabel: city.label,
        stationName,
        operatorKey: providerKey,
        operatorLabel,
        town,
        postcode,
        addressLine1: info.AddressLine1 || null,
        addressLine2: info.AddressLine2 || null,
        accessComments,
        relatedUrl: info.RelatedURL || null,
        maxKw,
        speedBand,
        speedLabel: getSpeedLabel(speedBand, maxKw),
        rapidLikely: speedBand === 'rapid' || speedBand === 'ultra',
        capacity,
        charge: usageCost,
        usageCost,
        publicAccess: isPublicAccess(usageTypeId),
        accessLabel: getUsageTypeLabel(usageTypeId),
        openingHours: alwaysOpen ? '24/7 (from comments)' : null,
        alwaysOpen,
        feeLabel: usageCost ? usageCost : 'Cost not stated',
        feeFree: isFreeToUse(usageCost),
        connectorSummary,
        dataSource: 'OCM',
        statusId,
        statusLabel: getStatusLabel(statusId),
        usageTypeId,
        usageTypeLabel: getUsageTypeLabel(usageTypeId),
        generalComments,
        lastStatusDate: row.DateLastStatusUpdate || row.DateLastVerified || row.DateCreated || null,
        qualityLabel:
          row.DataQualityLevel != null ? `Quality level ${row.DataQualityLevel}` : 'Quality not stated',
        searchText: [
          stationName,
          operatorLabel,
          town,
          postcode,
          info.AddressLine1,
          info.AddressLine2,
          connectorSummary,
          usageCost,
          generalComments,
          accessComments,
          getStatusLabel(statusId),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      },
    })
  })

  return { type: 'FeatureCollection', features }
}

export function usePart3Dataset() {
  const [state, setState] = useState({
    datasetByCity: {},
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true

    Promise.all(
      PART3_CITY_CONFIGS.map(async (city) => {
        try {
          const payloads = await Promise.all(city.dataPaths.map((path) => loadJson(path)))
          return [city.id, buildOcmDataset(city, payloads)]
        } catch {
          return [city.id, blankFeatureCollection()]
        }
      }),
    )
      .then((entries) => {
        if (!active) return

        setState({
          datasetByCity: Object.fromEntries(entries),
          loading: false,
          error: null,
        })
      })
      .catch((err) => {
        if (!active) return

        setState({
          datasetByCity: {},
          loading: false,
          error: err instanceof Error ? err.message : 'Unable to load Part 3 data.',
        })
      })

    return () => {
      active = false
    }
  }, [])

  return state
}
