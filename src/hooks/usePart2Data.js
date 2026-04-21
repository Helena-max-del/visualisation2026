import { useEffect, useMemo, useState } from 'react'
import { loadText } from '../utils/loadData'
import { parseCsv, asNumber } from '../utils/csv'

function median(arr) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function usePart2Data() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadText('/data/part2/borough_chargers.csv')
      .then((text) => {
        const rows = parseCsv(text).map((row) => ({
          code: row.code,
          name: row['Local authority'],
          totalChargers: asNumber(row['EV chargers']),
          rapidChargers: asNumber(row['50kW+ EV chargers']),
          chargersPerHundredK: asNumber(row['EV chargers per 100k']),
          pivCars: asNumber(row['PiV_cars_2025Q3']),
          bevCars: asNumber(row['BEV_cars_2025Q3']),
          chargersPer1000PiV: asNumber(row['chargers_per_1000_PiVs']),
          rapidPer1000PiV: asNumber(row['rapid_per_1000_PiVs']),
          rapidShare: asNumber(row['rapid_share']),
        }))
        setData(rows)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const medianTotal = useMemo(
    () => (data.length ? median(data.map((d) => d.chargersPer1000PiV)) : 0),
    [data],
  )

  const medianRapid = useMemo(
    () => (data.length ? median(data.map((d) => d.rapidPer1000PiV)) : 0),
    [data],
  )

  const sortedByTotal = useMemo(
    () => [...data].sort((a, b) => b.chargersPer1000PiV - a.chargersPer1000PiV),
    [data],
  )

  const sortedByRapid = useMemo(
    () => [...data].sort((a, b) => b.rapidPer1000PiV - a.rapidPer1000PiV),
    [data],
  )

  const rankShift = useMemo(() => {
    const totalRanks = new Map(sortedByTotal.map((d, index) => [d.code, index + 1]))
    const rapidRanks = new Map(sortedByRapid.map((d, index) => [d.code, index + 1]))

    return data
      .map((d) => {
        const totalRank = totalRanks.get(d.code) ?? null
        const rapidRank = rapidRanks.get(d.code) ?? null
        const delta = totalRank - rapidRank
        return {
          ...d,
          totalRank,
          rapidRank,
          rankDelta: delta,
          absRankDelta: Math.abs(delta),
        }
      })
      .sort((a, b) => b.absRankDelta - a.absRankDelta)
  }, [data, sortedByRapid, sortedByTotal])

  const sortedByRapidShare = useMemo(
    () => [...data].sort((a, b) => b.rapidShare - a.rapidShare),
    [data],
  )

  return {
    data,
    loading,
    error,
    medianTotal,
    medianRapid,
    sortedByTotal,
    sortedByRapid,
    sortedByRapidShare,
    rankShift,
  }
}
