import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { formatDuration } from '#/features/timer/protocol'
import { useRoomTimer } from '#/features/timer/useRoomTimer'
import { Play, Pause } from 'lucide-react'

export const Route = createFileRoute('/room/$roomId/display')({
  component: DisplayPage,
})

function DisplayPage() {
  const { roomId } = Route.useParams()
  const { remainingMs, snapshot, status, error } = useRoomTimer(roomId, 'display')

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
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center p-4 sm:p-8 md:p-12 relative">
      <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-8 md:gap-12 lg:gap-16">
        <div className="flex w-full flex-col items-center">
          <p className="text-center text-base font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-2 sm:mb-4">
            ROOM {roomId}
          </p>
          <div className={`flex items-center justify-center gap-4 sm:gap-6 md:gap-8 text-[18vw] leading-none font-extrabold tracking-tight tabular-nums sm:text-[14rem] md:text-[18rem] lg:text-[22rem] ${remainingMs !== null && remainingMs < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
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

      <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center gap-1 sm:bottom-6 sm:left-6 sm:right-6">
        {status !== 'connected' && (
          <p className="text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
            接続状態: {status}
          </p>
        )}
        {error ? (
          <p className="text-center text-sm font-bold text-red-500 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  )
}
