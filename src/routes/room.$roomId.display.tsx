import { createFileRoute } from '@tanstack/react-router'
import { formatDuration } from '#/features/timer/protocol'
import { useRoomTimer } from '#/features/timer/useRoomTimer'
import { Play, Pause } from 'lucide-react'

export const Route = createFileRoute('/room/$roomId/display')({
  component: DisplayPage,
})

function DisplayPage() {
  const { roomId } = Route.useParams()
  const { remainingMs, snapshot, status, error } = useRoomTimer(roomId, 'display')

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-8">
      <section className="w-full max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <p className="text-center text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          ROOM {roomId}
        </p>
        <p className={`text-center text-[20vw] leading-none font-extrabold tracking-tight tabular-nums sm:text-[16rem] ${remainingMs !== null && remainingMs < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
          {remainingMs === null ? '--:--' : formatDuration(remainingMs)}
        </p>
        <div className="flex items-center justify-center gap-2 text-xl font-semibold text-slate-700 dark:text-slate-200">
          {snapshot?.isRunning ? (
            <>
              <Play className="h-6 w-6 fill-cyan-500 text-cyan-500" aria-label="進行中" />
              <span>進行中</span>
            </>
          ) : (
            <>
              <Pause className="h-6 w-6 fill-slate-500 text-slate-500" aria-label="停止中" />
              <span>停止中</span>
            </>
          )}
        </div>
        <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
          接続状態: {status}
        </p>
        {error ? (
          <p className="mt-4 text-center text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  )
}
