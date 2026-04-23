import { useEffect, useRef } from 'react'

const HERO_PALETTES = {
  dark: {
    background: '#060810',
    glowCenter: [55, 100, 210],
    glowMid: [30, 65, 155],
    glowOuter: [15, 30, 80],
    grid: [60, 70, 110],
    connection: [100, 100, 105],
    pulse: [110, 110, 115],
    arcBright: [180, 180, 185],
    arcDim: [130, 130, 135],
    arcCore: [230, 230, 232],
    arcEndpoint: [200, 200, 205],
    outlineBase: [70, 70, 70],
    outlineHot: [255, 255, 255],
    fill: [100, 100, 105],
    trail: [110, 110, 115],
    spark: [220, 245, 255],
  },
  light: {
    background: '#eee8dd',
    glowCenter: [201, 150, 54],
    glowMid: [214, 176, 102],
    glowOuter: [231, 220, 201],
    grid: [154, 136, 109],
    connection: [128, 110, 84],
    pulse: [150, 127, 92],
    arcBright: [189, 150, 80],
    arcDim: [146, 122, 89],
    arcCore: [240, 223, 188],
    arcEndpoint: [214, 182, 120],
    outlineBase: [73, 63, 52],
    outlineHot: [214, 167, 88],
    fill: [132, 116, 94],
    trail: [152, 135, 109],
    spark: [255, 248, 235],
  },
}

function rgba(rgb, alpha) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
}

function mixRgb(from, to, t) {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry helpers
// ─────────────────────────────────────────────────────────────────────────────

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy)
}

// ─────────────────────────────────────────────────────────────────────────────
// Supercar silhouette
// ─────────────────────────────────────────────────────────────────────────────

function generateEVShape(width, height) {
  const points = []
  const scale  = Math.min(width, height)

  // ── Overall bounding box ──
  // carH is the TOTAL visual height (body + wheels below underbody)
  const carW   = scale * 1.08
  const carH   = carW * 0.330   // total height including wheel room
  const cx     = width  * 0.72
  const cy     = height * 0.58
  const left   = cx - carW / 2
  const right  = cx + carW / 2
  const top    = cy - carH / 2
  const bottom = cy + carH / 2   // = ground level

  // Large spoke wheels touching the ground
  const wheelR = carH * 0.255
  const w1x    = left + carW * 0.220  // front wheel centre
  const w2x    = left + carW * 0.730  // rear wheel centre
  const wy     = bottom - wheelR      // wheel centres (wheel bottoms at `bottom`)

  // Body reference lines
  const floorY = wy - wheelR * 0.08  // underbody / sill bottom

  // ── Helper ────────────────────────────────────────────────────────────────
  const s = (x1r, y1, x2r, y2) => [left + carW * x1r, y1, left + carW * x2r, y2]

  // ── Supercar outline (clockwise from front-splitter) ───────────────────────
  // Front face / nose (low wedge)
  const noseTipX  = left + carW * 0.010
  const noseTipY  = floorY - carH * 0.455   // mid-height of front face
  const hoodEndX  = left + carW * 0.390
  const hoodEndY  = top   + carH * 0.028    // hood-windshield junction
  const roofPeakX = left + carW * 0.555
  const roofPeakY = top   - carH * 0.010    // highest point
  const cPillarX  = left + carW * 0.700
  const cPillarY  = top   + carH * 0.025    // C-pillar top
  const rearTopX  = left + carW * 0.900
  const rearTopY  = top   + carH * 0.275    // rear shoulder
  const rearBotX  = left + carW * 0.970
  const rearBotY  = floorY - carH * 0.045   // rear bottom corner

  const outline = [
    // Front splitter to nose tip
    [left + carW*0.040, floorY,  noseTipX, floorY - carH*0.060],
    [noseTipX, floorY - carH*0.060,  noseTipX, noseTipY],
    // Front face to hood start
    [noseTipX, noseTipY,  left + carW*0.080, top + carH*0.230],
    // Long, low hood
    [left + carW*0.080, top + carH*0.230,  hoodEndX, hoodEndY],
    // Windshield (steep)
    [hoodEndX, hoodEndY,  roofPeakX - carW*0.050, roofPeakY - carH*0.030],
    // Short roof
    [roofPeakX - carW*0.050, roofPeakY - carH*0.030,  roofPeakX, roofPeakY],
    [roofPeakX, roofPeakY,  cPillarX, cPillarY],
    // Fastback / C-pillar drops hard
    [cPillarX, cPillarY,  rearTopX, rearTopY],
    // Rear face
    [rearTopX, rearTopY,  rearBotX, rearBotY],
    // Rear diffuser edge
    [rearBotX, rearBotY,  left + carW*0.880, floorY],
    // Underbody (rear → front, interrupted by wheel arches)
    [left + carW*0.880, floorY,  left + carW*0.420, floorY],
    [left + carW*0.420, floorY,  left + carW*0.100, floorY],
    // Front lower to splitter
    [left + carW*0.100, floorY,  left + carW*0.040, floorY],
  ]

  // ── Interior detail lines ─────────────────────────────────────────────────
  const details = [
    // Windshield inner frame
    s(0.410, hoodEndY + carH*0.08, 0.680, cPillarY + carH*0.06),
    // Primary body crease (angular, runs hood → rear)
    [left + carW*0.080, noseTipY + carH*0.05,
     left + carW*0.390, top + carH*0.245],
    [left + carW*0.390, top + carH*0.245,
     left + carW*0.890, top + carH*0.190],
    // Lower door sill
    s(0.100, floorY - carH*0.04, 0.880, floorY - carH*0.04),
    // Front chin splitter
    s(0.040, floorY + carH*0.02, 0.160, floorY + carH*0.02),
    // Rear diffuser fins
    s(0.820, floorY, 0.840, floorY - carH*0.05),
    s(0.855, floorY, 0.875, floorY - carH*0.05),
    // Hood vent line
    [left + carW*0.200, top + carH*0.185,
     left + carW*0.340, top + carH*0.070],
  ]

  // ── Body boundary helpers for fill ────────────────────────────────────────
  function topBoundaryY(px) {
    const xf = (px - left) / carW
    if (xf < 0.080) {
      // Front face: linear from noseTipY at x=0.010 to hood at x=0.080
      const t = (xf - 0.010) / 0.070
      return noseTipY + t * ((top + carH*0.230) - noseTipY)
    }
    if (xf < 0.390) {
      // Hood
      const t = (xf - 0.080) / 0.310
      return (top + carH*0.230) + t * (hoodEndY - top - carH*0.230)
    }
    if (xf < 0.700) {
      // Cabin / roof (flat-ish)
      return roofPeakY - carH*0.030
    }
    if (xf < 0.900) {
      // Fastback drop
      const t = (xf - 0.700) / 0.200
      return cPillarY + t * (rearTopY - cPillarY)
    }
    return rearTopY + (rearBotY - rearTopY) * (xf - 0.900) / 0.070
  }

  function nearWheel(px, py, wcx, wcy, r, th) {
    return Math.abs(Math.hypot(px - wcx, py - wcy) - r) < th
  }
  function nearOutline(px, py) {
    return outline.some(sg => distToSegment(px, py, ...sg) < 1.3)
        || details.some(sg => distToSegment(px, py, ...sg) < 1.0)
        || nearWheel(px, py, w1x, wy, wheelR,        1.2)
        || nearWheel(px, py, w2x, wy, wheelR,        1.2)
        || nearWheel(px, py, w1x, wy, wheelR * 0.55, 1.0)
        || nearWheel(px, py, w2x, wy, wheelR * 0.55, 1.0)
        || nearWheel(px, py, w1x, wy, wheelR * 0.28, 0.8)
        || nearWheel(px, py, w2x, wy, wheelR * 0.28, 0.8)
  }
  function insideBody(px, py) {
    if (px < left + carW*0.015 || px > left + carW*0.970) return false
    if (py < topBoundaryY(px))  return false
    if (py > floorY)            return false
    if (Math.hypot(px - w1x, py - wy) < wheelR - 5) return false
    if (Math.hypot(px - w2x, py - wy) < wheelR - 5) return false
    return true
  }

  let attempts = 0
  while (points.length < 13000 && attempts < 13000 * 22) {
    attempts++
    const px = Math.random() * width
    const py = Math.random() * height
    if (nearOutline(px, py)) {
      points.push({ x: px, y: py, type: 'outline' })
    } else if (Math.random() < 0.08 && insideBody(px, py)) {
      points.push({ x: px, y: py, type: 'fill' })
    } else if (Math.random() < 0.018) {
      const lineY = cy + carH * 0.58 + (Math.random() - 0.5) * 5
      const lineX = width * 0.18 + Math.random() * width * 0.66
      points.push({ x: lineX, y: lineY, type: 'trail' })
    }
  }
  return points
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightning arc
// ─────────────────────────────────────────────────────────────────────────────

function makeArc(x1, y1, x2, y2) {
  const segs = 5 + Math.floor(Math.random() * 5)
  const dx   = x2 - x1, dy = y2 - y1
  const len  = Math.hypot(dx, dy) || 1
  const nx   = -dy / len, ny = dx / len
  const nodes = [{ x: x1, y: y1 }]
  for (let i = 1; i < segs; i++) {
    const t   = i / segs
    const jag = (Math.random() - 0.5) * Math.min(28, len * 0.35)
    nodes.push({ x: x1 + dx * t + nx * jag, y: y1 + dy * t + ny * jag })
  }
  nodes.push({ x: x2, y: y2 })
  return { nodes, life: 0, maxLife: 260 + Math.random() * 220, bright: Math.random() > 0.45 }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle helpers — assemble → hold → dissolve → repeat
// ─────────────────────────────────────────────────────────────────────────────

const CYCLE_MS     = 18000  // full loop duration
const DISSOLVE_START = 0.62 // start dissolving immediately after assembly
const ASSEMBLE_END = 0.58   // 0→58% = ~10.4 s assembly
const HOLD_END     = 0.72   // 58→72% = ~2.5 s hold
// 72→100% = ~5.0 s dissolve

function cycleSettle(t) {
  if (t <= DISSOLVE_START) {
    const s = t / DISSOLVE_START
    return s * s * (3 - 2 * s)         // smoothstep up
  }
  const s = (t - DISSOLVE_START) / (1 - DISSOLVE_START)
  return 1 - s * s * (3 - 2 * s)       // smoothstep down
}

function isDissolvePhase(t) {
  return t > DISSOLVE_START
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ParticleEVHero({ theme = 'dark' }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const mouseRef  = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const palette = HERO_PALETTES[theme] ?? HERO_PALETTES.dark
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    let dpr = 1
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width  * (canvas.width  / dpr),
        y: (e.clientY - rect.top)  / rect.height * (canvas.height / dpr),
      }
    }
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 } }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    let width = 0, height = 0
    let particles  = []
    let outlinePts = []
    let arcs       = []
    let pulseWaves = []
    let startTime  = 0
    let lastTime   = 0
    let arcCooldown   = 1800
    let pulseCooldown = 4000

    function init() {
      width  = canvas.offsetWidth
      height = canvas.offsetHeight
      dpr    = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = width  * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const targets = generateEVShape(width, height)
      const carCX   = width  * 0.69
      const carCY   = height * 0.56

      particles = targets.map((t, i) => {
        const angle  = Math.random() * Math.PI * 2
        const spawnR = Math.max(width, height) * (0.9 + Math.random() * 1.4)
        // Small stagger (≤400 ms) so the loop feels cohesive
        const delay  = (i / targets.length) * 400
        return {
          x:         carCX + Math.cos(angle) * spawnR,
          y:         carCY + Math.sin(angle) * spawnR,
          vx: 0, vy: 0,
          tx: t.x, ty: t.y,
          type:      t.type,
          size:      t.type === 'outline'
                       ? 0.90 + Math.random() * 1.30
                       : 0.35 + Math.random() * 0.55,
          baseAlpha: t.type === 'outline'
                       ? 0.78 + Math.random() * 0.22
                       : t.type === 'fill'
                         ? 0.08 + Math.random() * 0.14
                         : 0.03 + Math.random() * 0.07,
          seed:      Math.random() * 1000,
          delay,
          hueShift:  (Math.random() - 0.5) * 28,
        }
      })

      outlinePts    = particles.filter(p => p.type === 'outline').filter((_, i) => i % 6 === 0)
      arcs          = []
      pulseWaves    = []
      arcCooldown   = 1800
      pulseCooldown = 4000
      startTime     = performance.now()
      lastTime      = startTime
    }

    // ── Background ─────────────────────────────────────────────────────────
    function drawBackground(elapsed, carCX, carCY, settleGlobal) {
      ctx.fillStyle = palette.background
      ctx.fillRect(0, 0, width, height)

      const pulse   = 0.80 + 0.20 * Math.sin(elapsed * 0.00175)
      const glowR   = width * 0.60 * pulse
      const glowAlp = (theme === 'light' ? 0.08 : 0.06) + settleGlobal * (theme === 'light' ? 0.09 : 0.10)
      const grd = ctx.createRadialGradient(carCX, carCY, 0, carCX, carCY, glowR)
      grd.addColorStop(0.00, rgba(palette.glowCenter, glowAlp * 1.4 * pulse))
      grd.addColorStop(0.28, rgba(palette.glowMid, glowAlp * 0.6 * pulse))
      grd.addColorStop(0.60, rgba(palette.glowOuter, glowAlp * 0.20 * pulse))
      grd.addColorStop(1.00, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, width, height)

      const gsp = 26
      const gox = (elapsed * 0.004) % gsp
      const goy = (elapsed * 0.0025) % gsp
      ctx.fillStyle = rgba(palette.grid, 1)
      for (let gx = width * 0.30; gx < width + gsp; gx += gsp) {
        for (let gy = -gsp; gy < height + gsp; gy += gsp) {
          const dd = Math.hypot(gx + gox - carCX, gy + goy - carCY)
          const density = theme === 'light' ? 0.068 : 0.055
          const a  = Math.max(0, (1 - dd / (width * 0.58)) * density * settleGlobal)
          if (a < 0.004) continue
          ctx.globalAlpha = a
          ctx.beginPath()
          ctx.arc(gx + gox, gy + goy, 0.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    // ── Connection web ──────────────────────────────────────────────────────
    function drawConnections(settleGlobal) {
      if (settleGlobal < 0.25) return
      const webAlpha = Math.min(1, (settleGlobal - 0.25) / 0.45)
      const maxDist  = 58, maxDist2 = 58 * 58
      ctx.lineWidth = 0.4
      for (let i = 0; i < outlinePts.length; i++) {
        const a = outlinePts[i]
        for (let j = i + 1; j < outlinePts.length; j++) {
          const b  = outlinePts[j]
          const dx = a.x - b.x
          if (Math.abs(dx) > maxDist) continue
          const dy = a.y - b.y
          if (Math.abs(dy) > maxDist) continue
          const d2 = dx * dx + dy * dy
          if (d2 >= maxDist2) continue
          const a2 = webAlpha * (1 - Math.sqrt(d2) / maxDist) * 0.13
          ctx.strokeStyle = rgba(palette.connection, a2)
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        }
      }
    }

    // ── Pulse rings ─────────────────────────────────────────────────────────
    function updatePulses(dt, carCX, carCY, settleGlobal) {
      if (settleGlobal > 0.55) {
        pulseCooldown -= dt
        if (pulseCooldown <= 0) {
          pulseCooldown = 3500 + Math.random() * 3000
          pulseWaves.push({ cx: carCX, cy: carCY, r: 0, maxR: width * 0.44, life: 0, maxLife: 1400 })
        }
      }
      pulseWaves = pulseWaves.filter(w => w.life < w.maxLife)
      for (const w of pulseWaves) {
        w.life += dt
        const t = w.life / w.maxLife
        w.r = w.maxR * (t * t)
        ctx.strokeStyle = rgba(palette.pulse, (1 - t) * 0.14)
        ctx.lineWidth = 1.8 * (1 - t * 0.7)
        ctx.beginPath(); ctx.arc(w.cx, w.cy, w.r, 0, Math.PI * 2); ctx.stroke()
        if (t > 0.12) {
          const t2 = t - 0.12
          ctx.strokeStyle = rgba(palette.pulse, (1 - t2) * 0.06)
          ctx.lineWidth = 0.8
          ctx.beginPath(); ctx.arc(w.cx, w.cy, w.maxR * (t2 * t2), 0, Math.PI * 2); ctx.stroke()
        }
      }
    }

    // ── Electric arcs ───────────────────────────────────────────────────────
    function updateArcs(dt, settleGlobal) {
      if (settleGlobal > 0.50) {
        arcCooldown -= dt
        if (arcCooldown <= 0) {
          arcCooldown = 1200 + Math.random() * 2200
          const sample = outlinePts.slice().sort(() => Math.random() - 0.5).slice(0, 60)
          outer: for (let i = 0; i < sample.length; i++) {
            for (let j = i + 1; j < sample.length; j++) {
              const d = Math.hypot(sample[i].x - sample[j].x, sample[i].y - sample[j].y)
              if (d > 25 && d < 110) {
                arcs.push(makeArc(sample[i].x, sample[i].y, sample[j].x, sample[j].y))
                break outer
              }
            }
          }
        }
      }
      arcs = arcs.filter(arc => arc.life < arc.maxLife)
      for (const arc of arcs) {
        arc.life += dt
        const t   = arc.life / arc.maxLife
        const env = t < 0.18 ? t / 0.18 : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1
        ctx.lineWidth   = 1.2 + (1 - t) * 0.8
        ctx.strokeStyle = arc.bright ? rgba(palette.arcBright, env * 0.65) : rgba(palette.arcDim, env * 0.45)
        ctx.beginPath()
        ctx.moveTo(arc.nodes[0].x, arc.nodes[0].y)
        for (let k = 1; k < arc.nodes.length; k++) ctx.lineTo(arc.nodes[k].x, arc.nodes[k].y)
        ctx.stroke()
        ctx.lineWidth   = 0.3
        ctx.strokeStyle = rgba(palette.arcCore, env * 0.55)
        ctx.beginPath()
        ctx.moveTo(arc.nodes[0].x, arc.nodes[0].y)
        for (let k = 1; k < arc.nodes.length; k++) ctx.lineTo(arc.nodes[k].x, arc.nodes[k].y)
        ctx.stroke()
        for (const ep of [arc.nodes[0], arc.nodes[arc.nodes.length - 1]]) {
          ctx.fillStyle = rgba(palette.arcEndpoint, env * 0.35)
          ctx.beginPath(); ctx.arc(ep.x, ep.y, 3.5 * env, 0, Math.PI * 2); ctx.fill()
        }
      }
    }

    // ── Main loop ───────────────────────────────────────────────────────────
    function animate(now) {
      const dt      = Math.min(48, now - lastTime)
      lastTime      = now
      const elapsed = now - startTime

      const carCX = width  * 0.72
      const carCY = height * 0.56

      // Global settle follows the same cycle (no per-particle stagger)
      const globalFrac   = (elapsed % CYCLE_MS) / CYCLE_MS
      const settleGlobal = cycleSettle(globalFrac)

      drawBackground(elapsed, carCX, carCY, settleGlobal)
      updatePulses(dt, carCX, carCY, settleGlobal)
      drawConnections(settleGlobal)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (const p of particles) {
        // Per-particle cycle: small delay offset so they stagger slightly each loop
        const particleFrac = ((elapsed + p.delay) % CYCLE_MS) / CYCLE_MS
        const settleT      = cycleSettle(particleFrac)
        const dissolving   = isDissolvePhase(particleFrac)

        // Breathing — amplitude grows when assembled; dual frequency for organic feel
        const breatheScale = p.type === 'outline'
          ? 0.8 + 3.2 * settleT          // 0.8 px assembling → 4 px when settled
          : p.type === 'fill'
            ? 0.3 + 1.4 * settleT
            : 0
        // Primary wave
        const wx1 = Math.cos((elapsed + p.seed)        * 0.00135) * breatheScale
        const wy1 = Math.sin((elapsed + p.seed * 1.55) * 0.00170) * breatheScale * 0.7
        // Secondary slower wave (different phase per particle)
        const wx2 = Math.cos((elapsed + p.seed * 2.30) * 0.00058) * breatheScale * 0.55
        const wy2 = Math.sin((elapsed + p.seed * 0.77) * 0.00044) * breatheScale * 0.45
        let tx = p.tx + wx1 + wx2
        let ty = p.ty + wy1 + wy2
        if (p.type === 'trail') {
          tx = p.tx + ((elapsed * 0.07 + p.seed) % (width * 0.72))
          ty = p.ty + Math.sin((elapsed + p.seed) * 0.0019) * 1.8
        }

        // Spring toward target — weaker when settled so breathing drift feels loose
        const kBase = p.type === 'outline' ? 0.015 : p.type === 'fill' ? 0.010 : 0.018
        const k     = kBase * (1 - 0.45 * settleT)   // 100% strength assembling → 55% at rest
        p.vx += (tx - p.x) * k * settleT
        p.vy += (ty - p.y) * k * settleT

        // Weak gravity toward car centre while assembling
        if (settleT < 1 && !dissolving) {
          const pull = 0.0014 * (1 - settleT) ** 2
          p.vx += (carCX - p.x) * pull
          p.vy += (carCY - p.y) * pull
        }

        // Outward scatter impulse during dissolve
        if (dissolving && settleT < 0.40) {
          const edx = p.x - carCX, edy = p.y - carCY
          const ed  = Math.hypot(edx, edy) || 1
          const str = (0.40 - settleT) * 0.30
          p.vx += (edx / ed) * str
          p.vy += (edy / ed) * str
        }

        if (dissolving || settleT < 0.16) {
          const drift = (dissolving ? 0.018 : 0.010) + (1 - settleT) * 0.010
          p.vx += Math.cos((elapsed + p.seed * 13.0) * 0.00115) * drift
          p.vy += Math.sin((elapsed + p.seed * 9.0) * 0.00145) * drift
        }

        // Mouse repulsion (only near full assembly)
        if (settleT > 0.50 && !dissolving) {
          const mdx = p.x - mx, mdy = p.y - my
          const md  = Math.hypot(mdx, mdy)
          if (md < 88 && md > 0.5) {
            const f = (1 - md / 88) * 2.0
            p.vx += (mdx / md) * f
            p.vy += (mdy / md) * f
          }
        }

        const damping = dissolving || settleT < 0.16 ? 0.918 : 0.876
        p.vx *= damping; p.vy *= damping
        p.x  += p.vx;  p.y  += p.vy

        const speed = Math.hypot(p.vx, p.vy)
        // Alpha pulse deepens as particles settle — 12% swing assembling → 42% swing at rest
        const pulseDepth = 0.12 + 0.30 * settleT
        const breathe    = (1 - pulseDepth) + pulseDepth * (0.5 + 0.5 * Math.sin((elapsed + p.seed) * 0.0024))
        const alpha      = p.baseAlpha * (0.06 + settleT * 1.0) * breathe

        if (p.type === 'outline') {
          // Colour: dark grey → mid grey → near-white as speed increases
          const heat = Math.min(1, speed / 2.8)
          const c    = Math.round(70 + heat * 185)   // 70 (dark grey) → 255 (white)
          const [r, g, b] = mixRgb(palette.outlineBase, palette.outlineHot, heat)

          // Velocity trail during high-speed travel
          if (speed > 1.1 && settleT < 0.92) {
            const trailA = Math.min(0.28, speed * 0.055) * settleT
            ctx.strokeStyle = `rgba(${r},${g},${b},${trailA})`
            ctx.lineWidth   = p.size * 0.55
            ctx.beginPath()
            ctx.moveTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5)
            ctx.lineTo(p.x, p.y); ctx.stroke()
          }

          // Outer halo
          if (alpha > 0.08) {
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.10})`
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.18})`
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2); ctx.fill()
          }

          // Core dot
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * breathe, 0, Math.PI * 2); ctx.fill()

          // Spark flash
          if (settleT > 0.55 && !dissolving && Math.random() < 0.003) {
            ctx.fillStyle = rgba(palette.spark, alpha * 0.5)
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2); ctx.fill()
          }

        } else if (p.type === 'fill') {
          ctx.fillStyle = rgba(palette.fill, alpha * 0.22)
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()

        } else {
          ctx.fillStyle = rgba(palette.trail, alpha * 0.38)
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        }
      }

      updateArcs(dt, settleGlobal)
      animRef.current = requestAnimationFrame(animate)
    }

    init()
    window.addEventListener('resize', init)
    animRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', init)
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}
