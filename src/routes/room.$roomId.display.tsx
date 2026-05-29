import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState, useEffect } from 'react'
import { formatDuration } from '#/features/timer/protocol'
import { useRoomTimer } from '#/features/timer/useRoomTimer'
import { useTimerPip } from '#/features/timer/useTimerPip'
import { Play, Pause, Maximize, Minimize, Tv } from 'lucide-react'
import Footer from '#/components/Footer'
import { cn } from '#/utils/cn'

export const Route = createFileRoute('/room/$roomId/display')({
  component: DisplayPage,
  head: ({ params }) => ({
    meta: [
      { title: `ROOM ${params.roomId} - 表示画面 | Presentation Timer` }
    ]
  }),
})

function DisplayPage() {
  const { roomId } = Route.useParams()
  const { remainingMs, snapshot, status, error } = useRoomTimer(roomId, 'display')
  const { isPipSupported, isPipActive, togglePip } = useTimerPip(roomId, remainingMs, snapshot, status)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false)
  const [isPopupVisible, setIsPopupVisible] = useState(true)

  const handleClosePopup = () => {
    setIsPopupVisible(false)
    const audio = new Audio('/bell.mp3')
    audio.volume = 0.01 // 極小音量で再生
    audio.play().catch(() => {})
  }

  useEffect(() => {
    setIsFullscreenSupported(
      document.fullscreenEnabled ??
      ('webkitFullscreenEnabled' in document && (document as any).webkitFullscreenEnabled) ??
      false
    )

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`)
        })
      }
    }
  }

  const timelineState = useMemo(() => {
    if (!snapshot || remainingMs === null) {
      return null
    }

    const totalDurationMs = snapshot.totalDurationMs
    const clampedRemainingMs = Math.min(totalDurationMs, Math.max(0, remainingMs))
    const elapsedMs = Math.max(0, totalDurationMs - clampedRemainingMs)
    const progressRatio = totalDurationMs <= 0 ? 0 : elapsedMs / totalDurationMs
    const alarmMarkers = snapshot.alarmElapsedMs.map((elapsedMs) => ({
      elapsedMs,
      progressPercent: (elapsedMs / totalDurationMs) * 100,
    }))

    return {
      elapsedMs,
      totalDurationMs,
      progressPercent: Math.min(100, Math.max(0, progressRatio * 100)),
      alarmMarkers,
    }
  }, [remainingMs, snapshot])

  return (
    <>
      {isPopupVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
            <div className="text-center">
              <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
                音声再生の許可
              </h2>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                バックグラウンドでもアラーム音を鳴らすために、閉じるボタンを押してください。
              </p>
            </div>
            <button
              onClick={handleClosePopup}
              className="w-full rounded-full bg-cyan-500 px-8 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-cyan-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 active:scale-[0.98] dark:focus:ring-offset-slate-900"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 flex gap-2 items-center z-40">
        {isPipSupported && (
          <button
            onClick={togglePip}
            className={cn(
              'p-3 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500',
              isPipActive
                ? 'text-cyan-500 hover:text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-label={isPipActive ? 'Picture-in-Picture解除' : 'Picture-in-Picture表示'}
            title={isPipActive ? 'Picture-in-Picture解除' : 'Picture-in-Picture表示'}
          >
            <Tv className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>
        )}
        {isFullscreenSupported && (
          <button
            onClick={toggleFullscreen}
            className="p-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label={isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン表示'}
            title={isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン表示'}
          >
            {isFullscreen ? <Minimize className="h-6 w-6 sm:h-8 sm:w-8" /> : <Maximize className="h-6 w-6 sm:h-8 sm:w-8" />}
          </button>
        )}
      </div>
      <main className="flex min-h-[100dvh] w-fit mx-auto flex-col items-center justify-center p-4 sm:p-8 md:p-12 relative bg-white dark:bg-slate-950">
        <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-8 md:gap-12 lg:gap-16">
          <div className="flex w-full flex-col items-center">
            <div className="flex gap-4 text-center text-base font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-2 sm:mb-4">
              <p>
                ROOM {roomId}
              </p>
              |
              <div className="flex flex-col items-center gap-1">
                <p>
                  STATUS {status}
                </p>
                {error ? (
                  <p className="text-center text-sm font-bold text-red-500 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
            <div className={cn(
              'flex items-center justify-center gap-4 sm:gap-6 md:gap-8 text-[18vw] leading-none font-extrabold tracking-tight tabular-nums',
              remainingMs !== null && remainingMs < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-slate-100'
            )}>
              {snapshot?.isRunning ? (
                <Play className="h-[0.7em] w-[0.7em] fill-cyan-500 text-cyan-500" aria-label="進行中" />
              ) : (
                <Pause className="h-[0.7em] w-[0.7em] fill-slate-300 text-slate-300 dark:fill-slate-700 dark:text-slate-700" aria-label="停止中" />
              )}
              <p>
                {remainingMs === null ? '--:--' : formatDuration(remainingMs)}
              </p>
            </div>
          </div>

          <div className="w-full max-w-5xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 md:text-base">
              <p>
                {timelineState ? `${Math.round(timelineState.progressPercent)}%` : '--'}
              </p>
              <p>
                {timelineState
                  ? `${formatDuration(timelineState.elapsedMs)} / ${formatDuration(timelineState.totalDurationMs)}`
                  : '--:-- / --:--'}
              </p>
            </div>
            <div className="relative pb-4">
              <div className="relative h-6 rounded-full bg-slate-200 dark:bg-slate-800 sm:h-8">
                <div
                  className="h-full rounded-full bg-cyan-500/80 transition-[width] duration-200 dark:bg-cyan-400/80"
                  style={{ width: `${timelineState?.progressPercent ?? 0}%` }}
                />
                {timelineState?.alarmMarkers.map((marker) => (
                  <div
                    key={marker.elapsedMs}
                    className="absolute top-1/2 h-8 w-3 sm:h-10 sm:w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-amber-500 bg-amber-300 dark:border-amber-400 dark:bg-amber-200"
                    style={{ left: `${marker.progressPercent}%` }}
                    title={formatDuration(marker.elapsedMs)}
                  />
                ))}
                <div
                  className="absolute top-1/2 right-0 h-8 w-3 sm:h-10 sm:w-4 -translate-y-1/2 rounded-full border-[3px] border-red-600 bg-red-500 dark:border-red-400 dark:bg-red-400"
                  title="終了時"
                />
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  )
}
