import { motion } from 'motion/react'

export default function Reveal({
  children,
  delay = 0,
  x = 0,
  y = 24,
  duration = 0.6,
  className = '',
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-90px' }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
