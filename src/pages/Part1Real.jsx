import { useMemo, useState } from 'react'
import Reveal from '../components/common/Reveal'
import GrowthTimeline from '../components/part1/GrowthTimeline'
import GrowthTrendChart from '../components/part1/GrowthTrendChart'
import CityFacilitiesGlobe from '../components/part1/CityFacilitiesGlobe'
import RegionalComparisonSection from '../components/part1/RegionalComparisonSection'
import SpeedBandShowcase from '../components/part1/SpeedBandShowcase'
import { usePart1Dataset } from '../hooks/usePart1Dataset'
import '../styles/part1.css'

export default function Part1Real() {
  const {
    growthData = [],
    speedData = [],
    regionalData = [],
    regionalNote = '',
    summary = {},
    loading = false,
    error = null,
  } = usePart1Dataset() || {}
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(null)

  const growthKpis = useMemo(() => {
    if (!growthData.length) return []

    const first = growthData[0]
    const latest = growthData[growthData.length - 1]
    const totalNow = Number(latest.total_devices || 0)
    const firstFastQuarter = summary.first50kwQuarter || growthData.find((row) => row.devices_50kw_plus != null)?.quarter
    const fastNow = latest.devices_50kw_plus != null ? Number(latest.devices_50kw_plus) : null
    const fastShare =
      latest.share_50kw_plus_pct != null
        ? Number(latest.share_50kw_plus_pct)
        : fastNow != null && totalNow
          ? (fastNow / totalNow) * 100
          : null
    const absoluteIncrease = totalNow - Number(first.total_devices || 0)

    return [
      {
        label: 'Latest quarter',
        value: latest.quarter,
        note: `DfT national snapshot for ${latest.month} ${latest.year}.`,
      },
      {
        label: 'Absolute increase',
        value: absoluteIncrease.toLocaleString(),
        note: `${first.quarter} to ${latest.quarter}.`,
      },
      {
        label: 'Latest total devices',
        value: totalNow.toLocaleString(),
        note: 'Public charging devices at all speeds in the latest national snapshot.',
      },
      {
        label: '50kW+ share',
        value: fastShare == null ? 'n/a' : `${fastShare.toFixed(1)}%`,
        note:
          fastNow == null
            ? 'The current 50kW+ series is not available for the latest row.'
            : `${fastNow.toLocaleString()} devices; consistent 50kW+ reporting starts in ${firstFastQuarter}.`,
      },
    ]
  }, [growthData, summary.first50kwQuarter])

  const growthStart = growthData.length ? growthData[0] : null
  const growthEnd = growthData.length ? growthData[growthData.length - 1] : null

  const latestSpeedMix = useMemo(() => {
    if (!speedData.length) return null

    const latest = speedData[speedData.length - 1]
    const rapidPlus =
      latest.rapid_plus_devices != null
        ? Number(latest.rapid_plus_devices)
        : Number(latest.rapid || 0) + Number(latest.ultraRapid || 0)
    const total = Number(latest.total_devices || 0)
    const share =
      latest.rapid_plus_share_pct != null
        ? Number(latest.rapid_plus_share_pct)
        : total
          ? (rapidPlus / total) * 100
          : null

    return { latest, rapidPlus, share }
  }, [speedData])

  const regionalLeader = useMemo(() => {
    if (!regionalData.length) return null

    return [...regionalData].sort(
      (a, b) =>
        Number(b.series[b.series.length - 1]?.totalDevices || 0) -
        Number(a.series[a.series.length - 1]?.totalDevices || 0)
    )[0]
  }, [regionalData])

  const timelineItems = useMemo(() => {
    return [
      {
        date: 'March 2017',
        title: 'Early policy support',
        description:
          'Early government support helped establish the public charging market, but provision was still limited and uneven across the country.',
        image: '/assets/part1/policy-2017.png',
        quarterKey: '2017-Q1',
      },
      {
        date: 'October 2019',
        title: 'Rapid corridor focus',
        description:
          'Attention shifts towards strategic road corridors and faster charging, making longer EV trips more realistic beyond city centres.',
        image: '/assets/part1/policy-2019.png',
        quarterKey: '2019-Q4',
      },
      {
        date: 'November 2022',
        title: 'Local EV Infrastructure (LEVI)',
        description:
          'Local authorities gain stronger support for neighbourhood charging, especially for households that cannot rely on private driveways.',
        image: '/assets/part1/policy-2022.png',
        quarterKey: '2022-Q4',
      },
      {
        date: 'February 2024',
        title: 'Mandate acceleration',
        description:
          'The ZEV mandate strengthens expectations for rapid scale-up, linking public charging readiness to a wider industrial EV transition.',
        image: '/assets/part1/policy-2024.png',
        quarterKey: '2024-Q1',
      },
    ]
  }, [])

  const activeQuarter = useMemo(() => {
    if (!timelineItems.length) return null
    if (activeTimelineIndex == null) return timelineItems[timelineItems.length - 1]?.quarterKey || null
    return timelineItems[activeTimelineIndex]?.quarterKey || null
  }, [timelineItems, activeTimelineIndex])

  if (loading) {
    return (
      <section className="part1-shell">
        <div className="part1-wrap">
          <p>Loading Part 1 data...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="part1-shell">
        <div className="part1-wrap">
          <p>Failed to load Part 1 data: {error}</p>
        </div>
      </section>
    )
  }

  return (
    <div className="part1-page">
      <section className="part1-shell" id="part1-story-start">
        <div className="part1-wrap">
          <Reveal>
            <div className="part1-page-heading">
              <p className="eyebrow">Part 1 | Network growth</p>
              <h1 className="part1-page-title">How quickly has the UK charging network grown?</h1>
              <p className="part1-page-subtitle">
                This section tracks headline network growth, the policy moments that shaped it, the regional pattern
                behind the national curve, and the shift from standard chargers towards faster provision.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="part1-intro-grid">
              <div>
                <p className="eyebrow">Why this matters</p>
                <h2 className="part1-section-heading">Growth is not the same as readiness</h2>
              </div>
              <div className="part1-intro-copy">
                <p>
                  As EV adoption rises, public charging availability becomes a practical condition for whether the
                  transport transition feels possible in everyday life.
                </p>
                <p>
                  Part 1 therefore begins with a simple question: how quickly has the UK public charging network grown,
                  and has that growth also improved the speed and convenience of charging?
                </p>
              </div>
            </div>
          </Reveal>

          <div className="part1-kpi-grid">
            {growthKpis.map((item, index) => (
              <Reveal key={item.label} delay={0.06 * index} y={24}>
                <div className="glass-card kpi-card-pro">
                  <p className="kpi-label">{item.label}</p>
                  <h3 className="kpi-value">{item.value}</h3>
                  <p className="kpi-note">{item.note}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="part1-main-grid">
            <Reveal x={-24} delay={0.08}>
              <div className="glass-card chart-panel part1-growth-panel">
                <div className="part1-panel-copy">
                  <p className="eyebrow">Total growth over time</p>
                  <h3 className="chart-title">Total network growth and the later 50kW+ series</h3>
                  <p className="chart-description">
                    The total network is shown for the full quarterly series from 2015-Q1 to 2026-Q1. The separate
                    50kW+ series only becomes available from 2023-Q4, after the DfT moved from a legacy 25kW+ threshold
                    to the current 50kW+ definition.
                  </p>
                </div>

                <GrowthTrendChart data={growthData} activeQuarter={activeQuarter} />
                <p className="chart-footnote">
                  The grey bars show year-on-year growth in total devices. Earlier rapid charging figures remain useful
                  historically, but they are not directly comparable with the current 50kW+ threshold.
                </p>
              </div>
            </Reveal>

            <Reveal x={24} delay={0.14}>
              <GrowthTimeline items={timelineItems} onActiveChange={setActiveTimelineIndex} />
            </Reveal>
          </div>

          <Reveal delay={0.16}>
            <RegionalComparisonSection data={regionalData} note={regionalNote} />
          </Reveal>

          <Reveal delay={0.17}>
            <CityFacilitiesGlobe />
          </Reveal>

          <Reveal delay={0.18}>
            <SpeedBandShowcase data={speedData} />
          </Reveal>

          <Reveal delay={0.2}>
            <section className="part1-takeaway">
              <div className="part1-takeaway-header">
                <p className="eyebrow">Conclusion</p>
                <h2 className="part1-takeaway-title">Growth does not automatically mean readiness</h2>
              </div>

              <div className="part1-takeaway-grid">
                <article className="glass-card takeaway-card">
                  <h3>01</h3>
                  <p>
                    The network grew from {growthStart?.total_devices?.toLocaleString?.() || 'n/a'} devices in{' '}
                    {growthStart?.quarter || 'the first quarter'} to {growthEnd?.total_devices?.toLocaleString?.() || 'n/a'} in{' '}
                    {growthEnd?.quarter || 'the latest quarter'}.
                  </p>
                </article>
                <article className="glass-card takeaway-card">
                  <h3>02</h3>
                  <p>
                    By {latestSpeedMix?.latest?.quarter || 'the latest quarter'}, rapid and ultra-rapid devices made up{' '}
                    {latestSpeedMix?.share != null ? `${latestSpeedMix.share.toFixed(1)}%` : 'n/a'} of the national stock.
                  </p>
                </article>
                <article className="glass-card takeaway-card">
                  <p>03</p>
                  <p>
                    The comparable region series only starts in 2025-Q1, but it already shows how much the latest stock
                    is concentrated in {regionalLeader?.name || 'the leading region'}.
                  </p>
                </article>
              </div>
            </section>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
