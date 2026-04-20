import { useEffect, useRef } from 'react'

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSq = dx * dx + dy * dy || 1
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.hypot(px - cx, py - cy)
}

function generateEVShape(width, height, density = 7600) {
  const points = []
  const scale = Math.min(width, height)

  const carW = scale * 1.02
  const carH = carW * 0.265
  const cx = width * 0.69
  const cy = height * 0.63

  const left = cx - carW / 2
  const right = cx + carW / 2
  const top = cy - carH / 2
  const bottom = cy + carH / 2

  const wheelR = carH * 0.19
  const wheel1X = cx - carW * 0.26
  const wheel2X = cx + carW * 0.26
  const wheelY = bottom - wheelR * 0.1

  const outlineSegments = [
    [left + carW * 0.05, bottom - wheelR * 0.06, left + carW * 0.05, top + carH * 0.35],
    [left + carW * 0.05, top + carH * 0.35, left + carW * 0.17, top + carH * 0.06],
    [left + carW * 0.17, top + carH * 0.06, left + carW * 0.45, top - carH * 0.34],
    [left + carW * 0.45, top - carH * 0.34, left + carW * 0.66, top - carH * 0.1],
    [left + carW * 0.66, top - carH * 0.1, right - carW * 0.08, top + carH * 0.12],
    [right - carW * 0.08, top + carH * 0.12, right - carW * 0.02, top + carH * 0.2],
    [right - carW * 0.02, top + carH * 0.2, right - carW * 0.02, bottom - wheelR * 0.06],
    [right - carW * 0.02, bottom - wheelR * 0.06, left + carW * 0.05, bottom - wheelR * 0.06],
  ]

  const detailSegments = [
    [left + carW * 0.17, top + carH * 0.06, left + carW * 0.61, top + carH * 0.1],
    [left + carW * 0.61, top + carH * 0.1, right - carW * 0.08, top + carH * 0.12],
    [cx, top + carH * 0.11, cx, bottom - wheelR * 0.5],
    [left + carW * 0.12, bottom - wheelR * 0.08, right - carW * 0.08, bottom - wheelR * 0.08],
  ]

  function roofLineY(px) {
    if (px < left + carW * 0.17 || px > right - carW * 0.08) return Infinity

    if (px <= left + carW * 0.45) {
      const t = (px - (left + carW * 0.17)) / (carW * 0.28)
      return top + carH * 0.06 + (-carH * 0.4) * t
    }

    if (px <= left + carW * 0.66) {
      const t = (px - (left + carW * 0.45)) / (carW * 0.21)
      return top - carH * 0.34 + (carH * 0.24) * t
    }

    const t = (px - (left + carW * 0.66)) / (carW * 0.26)
    return top - carH * 0.1 + (carH * 0.22) * t
  }

  function bodyTopY(px) {
    if (px < left + carW * 0.05 || px > right - carW * 0.02) return Infinity
    if (px < left + carW * 0.17) {
      const t = (px - (left + carW * 0.05)) / (carW * 0.12)
      return top + carH * 0.35 - carH * 0.29 * t
    }
    if (px > right - carW * 0.08) {
      const t = (px - (right - carW * 0.08)) / (carW * 0.06)
      return top + carH * 0.12 + carH * 0.08 * t
    }
    return top + carH * 0.1
  }

  function nearWheel(px, py, cxWheel, cyWheel, radius, thickness) {
    const d = Math.hypot(px - cxWheel, py - cyWheel)
    return Math.abs(d - radius) < thickness
  }

  function isNearOutline(px, py) {
    const segNear = outlineSegments.some((s) => distToSegment(px, py, ...s) < 1.8)
    const detailNear = detailSegments.some((s) => distToSegment(px, py, ...s) < 1.35)
    const wheel1 = nearWheel(px, py, wheel1X, wheelY, wheelR, 1.5)
    const wheel2 = nearWheel(px, py, wheel2X, wheelY, wheelR, 1.5)
    const wheelInner1 = nearWheel(px, py, wheel1X, wheelY, wheelR * 0.48, 1.15)
    const wheelInner2 = nearWheel(px, py, wheel2X, wheelY, wheelR * 0.48, 1.15)
    return segNear || detailNear || wheel1 || wheel2 || wheelInner1 || wheelInner2
  }

  function isInsideBody(px, py) {
    const roofY = roofLineY(px)
    const bodyY = bodyTopY(px)
    const inBody =
      px > left + carW * 0.05 &&
      px < right - carW * 0.02 &&
      py > bodyY &&
      py < bottom - wheelR * 0.08 &&
      Math.hypot(px - wheel1X, py - wheelY) > wheelR - 4 &&
      Math.hypot(px - wheel2X, py - wheelY) > wheelR - 4

    const inCabin =
      px > left + carW * 0.19 &&
      px < right - carW * 0.12 &&
      py > roofY &&
      py < top + carH * 0.1

    return inBody || inCabin
  }

  while (points.length < density) {
    const px = Math.random() * width
    const py = Math.random() * height

    if (isNearOutline(px, py)) {
      points.push({ x: px, y: py, type: 'outline' })
    } else if (Math.random() < 0.18 && isInsideBody(px, py)) {
      points.push({ x: px, y: py, type: 'fill' })
    } else if (Math.random() < 0.035) {
      const lineY = cy + carH * 0.58 + (Math.random() - 0.5) * 4
      const lineX = width * 0.18 + Math.random() * width * 0.68
      points.push({ x: lineX, y: lineY, type: 'trail' })
    }
  }

  return points
}

export default function ParticleEVHero({ theme = 'light' }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    let width = 0
    let height = 0
    let dpr = 1
    let particles = []
    let startTime = 0

    const isLight = theme === 'light'

    function init() {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const targets = generateEVShape(width, height, 7600)
      const orbitCenterX = width * 0.63
      const orbitCenterY = height * 0.56
      const fieldRadius = Math.max(width, height) * 0.72

      particles = targets.map((t, i) => {
        const angle = Math.random() * Math.PI * 2
        const radius = fieldRadius * (0.52 + Math.random() * 0.64)
        const swirl = (Math.random() * 0.7 + 0.2) * (Math.random() > 0.5 ? 1 : -1)
        const sizeBase = t.type === 'outline' ? Math.random() * 1.05 + 0.45 : Math.random() * 0.9 + 0.22

        return {
          x: orbitCenterX + Math.cos(angle) * radius,
          y: orbitCenterY + Math.sin(angle) * radius,
          baseAngle: angle,
          orbitRadius: radius,
          swirl,
          vx: 0,
          vy: 0,
          tx: t.x,
          ty: t.y,
          type: t.type,
          size: t.type === 'trail' ? Math.random() * 0.7 + 0.2 : sizeBase,
          alpha:
            t.type === 'outline'
              ? Math.random() * 0.58 + 0.24
              : t.type === 'fill'
                ? Math.random() * 0.12 + 0.04
                : Math.random() * 0.05 + 0.02,
          seed: Math.random() * 1000,
          delay: (i / targets.length) * 4200,
        }
      })

      startTime = performance.now()
    }

    function drawBackground(time) {
      ctx.fillStyle = isLight ? '#e8e1d4' : '#04060d'
      ctx.fillRect(0, 0, width, height)

      const halo = ctx.createRadialGradient(width * 0.71, height * 0.58, 0, width * 0.71, height * 0.58, width * 0.62)
      if (isLight) {
        halo.addColorStop(0, 'rgba(95, 144, 248, 0.14)')
        halo.addColorStop(0.22, 'rgba(95, 144, 248, 0.08)')
        halo.addColorStop(0.48, 'rgba(194, 154, 86, 0.09)')
        halo.addColorStop(1, 'rgba(0,0,0,0)')
      } else {
        halo.addColorStop(0, 'rgba(56, 120, 255, 0.12)')
        halo.addColorStop(0.42, 'rgba(56, 120, 255, 0.05)')
        halo.addColorStop(1, 'rgba(0,0,0,0)')
      }
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, width, height)

      const horizon = ctx.createLinearGradient(0, height * 0.68, 0, height)
      horizon.addColorStop(0, isLight ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)')
      horizon.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = horizon
      ctx.fillRect(0, height * 0.68, width, height * 0.32)

      for (let i = 0; i < 160; i += 1) {
        const x = (i * 84.7 + time * 0.006) % width
        const y = (i * 39.2 + Math.sin(i * 4.7) * 12 + time * 0.0025) % height
        const a = 0.018 + (i % 5) * 0.005
        ctx.fillStyle = isLight ? `rgba(45, 55, 82, ${a * 0.72})` : `rgba(255,255,255,${a})`
        ctx.beginPath()
        ctx.arc(x, y, (i % 3) + 0.35, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function animate(now) {
      const elapsed = now - startTime
      drawBackground(elapsed)

      const orbitCenterX = width * 0.63
      const orbitCenterY = height * 0.56
      const assembleStart = 1200
      const assembleDuration = 5200
      const disperseCycle = 18000

      const loopTime = elapsed % disperseCycle
      const disperseFactor = loopTime > 13500 ? (loopTime - 13500) / 4500 : 0
      const reassembleBoost = loopTime < 2500 ? 1 - loopTime / 2500 : 0

      particles.forEach((p, index) => {
        const appearDelay = p.delay * 0.42
        const localElapsed = Math.max(0, elapsed - appearDelay)
        const assembleT = Math.max(0, Math.min(1, (localElapsed - assembleStart) / assembleDuration))
        const settleT = assembleT * assembleT * (3 - 2 * assembleT)

        const orbitAngle = p.baseAngle + elapsed * 0.00032 * p.swirl + index * 0.00002
        const orbitX = orbitCenterX + Math.cos(orbitAngle) * p.orbitRadius
        const orbitY = orbitCenterY + Math.sin(orbitAngle) * p.orbitRadius * 0.64

        const waveX = Math.cos((elapsed + p.seed) * 0.00145) * (p.type === 'outline' ? 1.6 : 1.05)
        const waveY = Math.sin((elapsed + p.seed * 1.7) * 0.00185) * (p.type === 'outline' ? 1.2 : 0.8)
        const breathe = 0.84 + 0.16 * Math.sin((elapsed + p.seed) * 0.003)

        let targetX = p.tx + waveX
        let targetY = p.ty + waveY

        if (p.type === 'trail') {
          targetX = p.tx + ((elapsed * 0.11 + p.seed) % (width * 0.72))
          targetY = p.ty + Math.sin((elapsed + p.seed) * 0.0022) * 1.2
        }

        const blendFromOrbit = 1 - settleT
        const blendToTarget = settleT

        let desiredX = orbitX * blendFromOrbit + targetX * blendToTarget
        let desiredY = orbitY * blendFromOrbit + targetY * blendToTarget

        if (disperseFactor > 0 && p.type !== 'trail') {
          desiredX = desiredX * (1 - disperseFactor * 0.26) + orbitX * disperseFactor * 0.26
          desiredY = desiredY * (1 - disperseFactor * 0.26) + orbitY * disperseFactor * 0.26
        }

        if (reassembleBoost > 0 && p.type !== 'trail') {
          desiredX = desiredX * (1 - reassembleBoost * 0.14) + orbitX * reassembleBoost * 0.14
          desiredY = desiredY * (1 - reassembleBoost * 0.14) + orbitY * reassembleBoost * 0.14
        }

        const strength = p.type === 'outline' ? 0.014 : p.type === 'fill' ? 0.009 : 0.018
        p.vx += (desiredX - p.x) * strength
        p.vy += (desiredY - p.y) * strength
        p.vx *= p.type === 'trail' ? 0.78 : 0.88
        p.vy *= p.type === 'trail' ? 0.78 : 0.88
        p.x += p.vx
        p.y += p.vy

        const alpha = p.alpha * (0.15 + settleT * 1.02) * (p.type === 'trail' ? 0.55 : 1)
        const size = p.size * breathe

        if (p.type === 'outline') {
          ctx.beginPath()
          ctx.fillStyle = isLight ? `rgba(39, 52, 88, ${alpha})` : `rgba(255,255,255,${alpha})`
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fill()

          if (Math.random() < 0.012 && settleT > 0.42) {
            ctx.beginPath()
            ctx.fillStyle = isLight ? 'rgba(110, 158, 255, 0.08)' : 'rgba(110,190,255,0.08)'
            ctx.arc(p.x, p.y, size * 5.2, 0, Math.PI * 2)
            ctx.fill()
          }
        } else if (p.type === 'fill') {
          ctx.beginPath()
          ctx.fillStyle = isLight ? `rgba(88, 132, 223, ${alpha * 0.42})` : `rgba(120,190,255,${alpha * 0.46})`
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.fillStyle = isLight ? `rgba(188, 149, 84, ${alpha * 0.6})` : `rgba(120,190,255,${alpha * 0.4})`
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    function handleResize() {
      init()
    }

    init()
    window.addEventListener('resize', handleResize)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
