import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
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
  const [alarmMinutesInput, setAlarmMinutesInput] = useState('')

  const parsedMinutes = useMemo(() => Number(minutesInput), [minutesInput])
  const canSetDuration = Number.isFinite(parsedMinutes) && parsedMinutes > 0
  const parsedAlarmMinutes = useMemo(() => {
    const tokens = alarmMinutesInput
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
    if (tokens.length === 0) {
      return []
    }

    const parsed = tokens.map((value) => Number(value))
    if (parsed.some((value) => !Number.isFinite(value) || value <= 0)) {
      return null
    }
    return parsed.map((minutes) => Math.round(minutes * 60_000))
  }, [alarmMinutesInput])
  const canSetAlarms = parsedAlarmMinutes !== null
  const activeAlarmLabel = useMemo(() => {
    if (!snapshot) {
      return '終了時'
    }
    const labels = snapshot.alarmElapsedMs.map((elapsedMs) => `${elapsedMs / 60_000}分`)
    return [...labels, '終了時'].join(' / ')
  }, [snapshot])
  const displayUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return new URL(`/room/${roomId}/display`, window.location.origin).toString()
  }, [roomId])

  return (
    <main className="min-h-screen w-full p-4 sm:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] sm:min-h-[calc(100vh-3rem)]">
        <section className="border-b border-slate-300 py-5 dark:border-slate-700 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              ROOM {roomId}
            </p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {snapshot?.isRunning ? '進行中' : '停止中'} / 接続: {status}
            </p>
          </div>
        </section>

        <div className="grid flex-1 gap-6 pt-6 xl:grid-cols-[2fr_1fr]">
          <section className="sm:pr-8 xl:border-r xl:border-slate-300 xl:pr-6 xl:dark:border-slate-700">
            <p className="text-center text-[18vw] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-[10rem] xl:text-[11rem] dark:text-slate-100">
              {remainingMs === null ? '--:--' : formatDuration(remainingMs)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
              <button
                type="button"
                onClick={() => sendCommand({ type: 'start' })}
                className="border border-cyan-300 bg-cyan-100 px-4 py-4 text-lg font-bold text-cyan-900 transition hover:bg-cyan-200 dark:border-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200 dark:hover:bg-cyan-500/30"
              >
                開始
              </button>
              <button
                type="button"
                onClick={() => sendCommand({ type: 'pause' })}
                className="border border-slate-300 bg-white px-4 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                停止
              </button>
              <button
                type="button"
                onClick={() => sendCommand({ type: 'reset' })}
                className="border border-slate-300 bg-white px-4 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                リセット
              </button>
              <button
                type="button"
                onClick={() => sendCommand({ type: 'add-time', deltaMs: 60_000 })}
                className="border border-slate-300 bg-white px-4 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                +1分
              </button>
              <button
                type="button"
                onClick={() => sendCommand({ type: 'add-time', deltaMs: -60_000 })}
                className="border border-slate-300 bg-white px-4 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                -1分
              </button>
            </div>
          </section>

          <aside className="grid content-start divide-y divide-slate-300 dark:divide-slate-700">
            <section className="py-5">
              <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
                初期時間を設定
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={minutesInput}
                  onChange={(event) => setMinutesInput(event.target.value)}
                  inputMode="decimal"
                  className="w-36 border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-cyan-200 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-cyan-500/40"
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
                  className="border border-slate-300 bg-white px-5 py-3 text-lg font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  反映
                </button>
              </div>
            </section>

            <section className="py-5">
              <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
                鳴動タイミングを設定
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                カンマ区切りで分を指定します（例: 5,8）。終了時は常に鳴動します。
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                現在: {activeAlarmLabel}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={alarmMinutesInput}
                  onChange={(event) => setAlarmMinutesInput(event.target.value)}
                  inputMode="decimal"
                  placeholder="例: 5,8"
                  className="w-36 border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-cyan-200 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-cyan-500/40"
                />
                <button
                  type="button"
                  disabled={!canSetAlarms}
                  onClick={() =>
                    sendCommand({
                      type: 'set-alarms',
                      elapsedMs: parsedAlarmMinutes ?? [],
                    })
                  }
                  className="border border-slate-300 bg-white px-5 py-3 text-lg font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  反映
                </button>
              </div>
            </section>

            <section className="py-5">
              <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
                閲覧画面のQRコード
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                表示端末で読み取ると閲覧画面を開けます。
              </p>
              <div className="mt-3 flex flex-col items-start gap-3">
                {displayUrl ? (
                  <>
                    <div className="border border-slate-300 p-3 dark:border-slate-600">
                      <QRCodeSVG value={displayUrl} size={170} includeMargin />
                    </div>
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-cyan-700 underline underline-offset-2 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                    >
                      閲覧画面を開く
                    </a>
                  </>
                ) : null}
              </div>
            </section>

            {error ? (
              <section className="border-l-2 border-red-500 py-4 pl-3">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  )
}
