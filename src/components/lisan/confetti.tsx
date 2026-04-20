'use client'

import React, { useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {
  const fire = useCallback((opts = {}) => {
    confetti({
      ...opts,
      origin: { y: 0.7 },
      zIndex: 9999,
    })
  }, [])

  const fireSchoolPride = useCallback(() => {
    const end = Date.now() + 3 * 1000
    const colors = ['#10b981', '#f59e0b', '#ffffff']

    ;(function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()
  }, [])

  return { fire, fireSchoolPride }
}

export function ConfettiCelebration() {
  const { fireSchoolPride } = useConfetti()
  
  useEffect(() => {
    fireSchoolPride()
  }, [fireSchoolPride])

  return null
}
