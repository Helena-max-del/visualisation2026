import { useEffect, useRef, useState } from 'react'

export default function GrowthTimeline({ items = [], onActiveChange }) {
  const scrollRef = useRef(null)
  const itemRefs = useRef([])
  const [activeIndex, setActiveIndex] = useState(items.length ? items.length - 1 : 0)

  useEffect(() => {
    if (!items.length) return
    setActiveIndex(items.length - 1)
  }, [items])

  useEffect(() => {
    if (typeof onActiveChange === 'function') {
      onActiveChange(activeIndex)
    }
  }, [activeIndex, onActiveChange])

  useEffect(() => {
    const root = scrollRef.current
    if (!root || !items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = activeIndex
        let bestRatio = 0

        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.index)
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio
            bestIndex = idx
          }
        })

        if (bestIndex !== activeIndex) {
          setActiveIndex(bestIndex)
        }
      },
      {
        root,
        threshold: [0.25, 0.45, 0.65, 0.85],
        rootMargin: '-10% 0px -20% 0px',
      }
    )

    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [items, activeIndex])

  const scrollToItem = (index) => {
    const root = scrollRef.current
    const target = itemRefs.current[index]
    if (!root || !target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setActiveIndex(index)
  }

  return (
    <aside className="timeline-shell glass-card timeline-shell-card">
      <div className="timeline-shell-header">
        <p className="timeline-shell-eyebrow">Policy timeline</p>
        <h3 className="timeline-shell-title">Milestones shaping network growth</h3>
      </div>

      <div className="timeline-scroll" ref={scrollRef}>
        {items.map((item, index) => (
          <button
            key={`${item.date}-${index}`}
            ref={(el) => (itemRefs.current[index] = el)}
            data-index={index}
            type="button"
            onClick={() => scrollToItem(index)}
            className={`timeline-item ${index === activeIndex ? 'is-active' : ''}`}
          >
            <div className={`timeline-dot ${index === activeIndex ? 'is-active' : ''}`} />
            <p className="timeline-date">{item.date}</p>
            <h4 className="timeline-title">{item.title}</h4>
            <p className="timeline-desc">{item.description}</p>

            {item.image ? (
              <div className="timeline-image-wrap">
                <img src={item.image} alt={item.title} className="timeline-image" />
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </aside>
  )
}
