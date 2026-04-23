import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { formatDuration } from '#/features/timer/protocol'
import { useRoomTimer } from '#/features/timer/useRoomTimer'

export const Route = createFileRoute('/room/$roomId/control')({
  component: ControlPage,
})

function ControlPage() {
  const { roomId } = Route.useParams()
  const { remainingMs, snapshot, status, error, sendCommand } = useRoomTimer(
    roomId,
    'control',
  )
  const [minutesInput, setMinutesInput] = useState('5')

  const parsedMinutes = useMemo(() => Number(minutesInput), [minutesInput])
  const canSetDuration = Number.isFinite(parsedMinutes) && parsedMinutes > 0

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <p className="text-center text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          ROOM {roomId}
        </p>
        <p className="text-center text-[16vw] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-[9rem] dark:text-slate-100">
          {remainingMs === null ? '--:--' : formatDuration(remainingMs)}
        </p>
        <p className="mb-6 text-center text-lg font-semibold text-slate-700 dark:text-slate-200">
          {snapshot?.isRunning ? '進行中' : '停止中'} / 接続: {status}
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <button
            type="button"
            onClick={() => sendCommand({ type: 'start' })}
            className="rounded-2xl border border-cyan-300 bg-cyan-100 px-4 py-4 text-lg font-bold text-cyan-900 transition hover:bg-cyan-200 dark:border-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200 dark:hover:bg-cyan-500/30"
          >
            開始
          </button>
          <button
            type="button"
            onClick={() => sendCommand({ type: 'pause' })}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            停止
          </button>
          <button
            type="button"
            onClick={() => sendCommand({ type: 'reset' })}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            リセット
          </button>
          <button
            type="button"
            onClick={() => sendCommand({ type: 'add-time', deltaMs: 60_000 })}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            +1分
          </button>
          <button
            type="button"
            onClick={() => sendCommand({ type: 'add-time', deltaMs: -60_000 })}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            -1分
          </button>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
            初期時間を設定
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={minutesInput}
              onChange={(event) => setMinutesInput(event.target.value)}
              inputMode="decimal"
              className="w-40 rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-cyan-200 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-cyan-500/40"
            />
            <span className="text-base text-slate-600 dark:text-slate-300">分</span>
            <button
              type="button"
              disabled={!canSetDuration}
              onClick={() =>
                sendCommand({
                  type: 'set-duration',
                  durationMs: Math.round(parsedMinutes * 60_000),
                })
              }
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-lg font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              反映
            </button>
          </div>
        </section>

        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>
        ) : null}
      </section>
    </main>
  )
}
