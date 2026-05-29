import { useEffect, useRef, useState } from 'react'
import { formatDuration } from './protocol'

// Canvas rendering helper for Picture-in-Picture
const drawTimer = (
  canvas: HTMLCanvasElement,
  roomId: string,
  remainingMs: number | null,
  snapshot: any,
  status: string
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // Clear canvas
  ctx.fillStyle = '#0f172a' // slate-900
  ctx.fillRect(0, 0, width, height)

  // Draw remaining time (maximized size with dynamic scaling)
  const timeStr = remainingMs === null ? '--:--' : formatDuration(remainingMs)
  
  let fontSize = 150
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${fontSize}px sans-serif`
  while (ctx.measureText(timeStr).width > width - 40 && fontSize > 40) {
    fontSize -= 5
    ctx.font = `bold ${fontSize}px sans-serif`
  }

  if (remainingMs !== null && remainingMs < 0) {
    ctx.fillStyle = '#ef4444' // red-500
  } else {
    ctx.fillStyle = '#22d3ee' // cyan-400
  }
  
  const pBarH = 12
  const pBarY = height - pBarH
  const pBarW = width
  const pBarX = 0

  // Offset to center in the remaining height (above the bottom progress bar)
  ctx.fillText(timeStr, width / 2, pBarY / 2)

  // Draw progress bar
  if (snapshot) {
    const total = snapshot.totalDurationMs
    const remaining = Math.min(total, Math.max(0, remainingMs ?? 0))
    const elapsed = Math.max(0, total - remaining)
    const ratio = total <= 0 ? 0 : elapsed / total

    // Draw progress background
    ctx.fillStyle = '#334155' // slate-700
    ctx.fillRect(pBarX, pBarY, pBarW, pBarH)

    // Draw progress fill
    ctx.fillStyle = '#22d3ee' // cyan-400
    ctx.fillRect(pBarX, pBarY, pBarW * ratio, pBarH)

    // Draw alarm markers
    snapshot.alarmElapsedMs.forEach((alarmMs: number) => {
      const aRatio = alarmMs / total
      const aX = pBarX + pBarW * aRatio
      ctx.fillStyle = '#f59e0b' // amber-500
      ctx.fillRect(aX - 2, pBarY, 4, pBarH)
    })

    // Draw end marker
    ctx.fillStyle = '#ef4444' // red-500
    ctx.fillRect(pBarX + pBarW - 4, pBarY, 4, pBarH)
  }
}

export function useTimerPip(
  roomId: string,
  remainingMs: number | null,
  snapshot: any,
  status: string
) {
  const [isPipActive, setIsPipActive] = useState(false)
  const [isPipSupported, setIsPipSupported] = useState(false)
  const pipVideoRef = useRef<HTMLVideoElement | null>(null)
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    setIsPipSupported(
      'pictureInPictureEnabled' in document && document.pictureInPictureEnabled
    )

    return () => {
      if (pipVideoRef.current) {
        pipVideoRef.current.remove()
      }
    }
  }, [])

  const togglePip = async () => {
    if (!isPipSupported) return

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch((err) => {
        console.error('Failed to exit PiP:', err)
      })
      return
    }

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 250
    pipCanvasRef.current = canvas

    // Initial draw
    drawTimer(canvas, roomId, remainingMs, snapshot, status)

    // Capture stream at 10fps
    const stream = (canvas as any).captureStream(10)

    // Create video element
    const video = document.createElement('video')
    video.autoplay = true
    video.muted = true
    video.playsInline = true
    video.width = 400
    video.height = 250
    video.srcObject = stream

    // Hide video offscreen/behind other elements
    video.style.position = 'fixed'
    video.style.bottom = '0'
    video.style.right = '0'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.opacity = '0.01'
    video.style.pointerEvents = 'none'
    video.style.zIndex = '-9999'

    document.body.appendChild(video)
    pipVideoRef.current = video

    video.onenterpictureinpicture = () => {
      setIsPipActive(true)
    }

    video.onleavepictureinpicture = () => {
      setIsPipActive(false)
      video.remove()
      pipVideoRef.current = null
      pipCanvasRef.current = null
    }

    try {
      await video.play()
      await video.requestPictureInPicture()
    } catch (err) {
      console.error('Failed to enter PiP:', err)
      video.remove()
      pipVideoRef.current = null
      pipCanvasRef.current = null
    }
  }

  // Redraw canvas whenever state updates
  useEffect(() => {
    if (isPipActive && pipCanvasRef.current) {
      drawTimer(pipCanvasRef.current, roomId, remainingMs, snapshot, status)
    }
  }, [remainingMs, snapshot, status, isPipActive, roomId])

  return {
    isPipSupported,
    isPipActive,
    togglePip,
  }
}
