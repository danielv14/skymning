import { useState, useEffect } from 'react'

type Star = {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
}

type StarFieldProps = {
  starCount?: number
  className?: string
}

const generateStars = (count: number): Star[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 1.5 : 2,
    opacity: 0.4 + Math.random() * 0.6,
    duration: 3 + Math.random() * 6,
    delay: Math.random() * 8,
  }))
}

export const StarField = ({ starCount = 40, className = '' }: StarFieldProps) => {
  const [stars, setStars] = useState<Star[]>([])

  // Generate stars only on client to avoid hydration mismatch
  useEffect(() => {
    setStars(generateStars(starCount))
  }, [starCount])

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white star-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
