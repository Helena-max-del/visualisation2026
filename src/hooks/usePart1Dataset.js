import { useEffect, useMemo, useState } from 'react'
import { loadJson } from '../utils/loadData'

const part1Path = '/data/part1/part1_evci9001_processed.json'
const regionalPath = '/data/part1/uk_regional_growth.json'

const toNumber = (value) => {
  if (value == null || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const readMetric = (rows, metric) => rows.find((row) => row.metric === metric)?.value ?? null

export function usePart1Dataset() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    part1Payload: null,
    regionalPayload: null,
  })

  useEffect(() => {
    let alive = true

    Promise.all([loadJson(part1Path), loadJson(regionalPath)])
      .then(([part1Payload, regionalPayload]) => {
        if (!alive) return
        setState({
          loading: false,
          error: null,
          part1Payload,
          regionalPayload,
        })
      })
      .catch((err) => {
        if (!alive) return
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Unable to load Part 1 data.',
          part1Payload: null,
          regionalPayload: null,
        })
      })

    return () => {
      alive = false
    }
  }, [])

  const derived = useMemo(() => {
    const sheets = state.part1Payload?.sheets ?? {}
    const summaryRows = sheets.Summary ?? []
    const growthRows = sheets.UK_quarterly_growth ?? []
    const speedRows = sheets.UK_speed_structure ?? []

    const growthData = growthRows.map((row) => ({
      date: row.Date,
      quarter: row.Quarter,
      year: toNumber(row.Year),
      month: row.Month,
      total_devices: toNumber(row.Total_devices),
      devices_50kw_plus: toNumber(row.Devices_50kW_plus),
      rapid_or_above_legacy: toNumber(row.Rapid_or_above_legacy),
      qoq_growth_pct: toNumber(row.QoQ_growth_total_pct),
      yoy_growth_pct: toNumber(row.YoY_growth_total_pct),
      share_50kw_plus_pct: toNumber(row.Share_50kW_plus_pct),
      share_rapid_or_above_legacy_pct: toNumber(row.Share_rapid_or_above_legacy_pct),
    }))

    const speedData = speedRows.map((row) => ({
      date: row.Date,
      quarter: row.Quarter,
      year: toNumber(row.Year),
      month: row.Month,
      speedSystem: row.speed_system,
      standard: toNumber(row.standard_devices),
      standardPlus: toNumber(row.standard_plus_devices),
      rapid: toNumber(row.rapid_devices),
      ultraRapid: toNumber(row.ultra_rapid_devices),
      rapid_plus_devices: toNumber(row.rapid_plus_devices),
      total_devices: toNumber(row.Total_devices),
      standard_share_pct: toNumber(row.standard_share_pct),
      standard_plus_share_pct: toNumber(row.standard_plus_share_pct),
      rapid_share_pct: toNumber(row.rapid_share_pct),
      ultra_rapid_share_pct: toNumber(row.ultra_rapid_share_pct),
      rapid_plus_share_pct: toNumber(row.rapid_plus_share_pct),
      comparability_note: row.comparability_note,
    }))

    const regionalData = (state.regionalPayload?.regions ?? []).map((region) => ({
      name: region.name,
      series: (region.series ?? []).map((row) => ({
        dateLabel: row.dateLabel,
        quarter: row.quarter,
        totalDevices: toNumber(row.totalDevices),
        devices50kwPlus: toNumber(row.devices50kwPlus),
        totalPer100k: toNumber(row.totalPer100k),
        devices50kwPlusPer100k: toNumber(row.devices50kwPlusPer100k),
      })),
    }))

    const summary = {
      firstQuarter: readMetric(summaryRows, 'First quarter in table'),
      latestQuarter: readMetric(summaryRows, 'Latest quarter in table'),
      totalDevicesAtStart: toNumber(readMetric(summaryRows, 'Total devices at start')),
      totalDevicesAtEnd: toNumber(readMetric(summaryRows, 'Total devices at end')),
      absoluteIncrease: toNumber(readMetric(summaryRows, 'Absolute increase in total devices')),
      growthMultiple: toNumber(readMetric(summaryRows, 'Growth multiple in total devices')),
      first50kwQuarter: readMetric(summaryRows, 'First quarter with 50kW+ series'),
      first50kwDevices: toNumber(readMetric(summaryRows, '50kW+ devices at first available quarter')),
      latest50kwDevices: toNumber(readMetric(summaryRows, '50kW+ devices at latest quarter')),
      latest50kwShare: toNumber(readMetric(summaryRows, 'Latest 50kW+ share of total devices')),
      latestRapidPlusShare: toNumber(readMetric(summaryRows, 'Latest rapid+ultra share in speed table')),
    }

    return {
      growthData,
      speedData,
      regionalData,
      regionalNote: state.regionalPayload?.note ?? '',
      summary,
    }
  }, [state])

  return { ...state, ...derived }
}
