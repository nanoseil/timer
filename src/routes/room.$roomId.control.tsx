import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { formatDuration } from '#/features/timer/protocol'
import { useRoomTimer } from '#/features/timer/useRoomTimer'
import { Play, Pause } from 'lucide-react'
import Footer from '#/components/Footer'

export const Route = createFileRoute('/room/$roomId/control')({
  component: ControlPage,
  head: ({ params }) => ({
    meta: [
      { title: `ROOM ${params.roomId} - 操作画面 | Presentation Timer` }
    ]
  }),
})

function parseDurationInputToMs(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    if (parts.length !== 2) {
      return null
    }

    const [minutesPart, secondsPart] = parts
    if (!/^\d+$/.test(minutesPart) || !/^\d{1,2}$/.test(secondsPart)) {
      return null
    }

    const minutes = Number(minutesPart)
    const seconds = Number(secondsPart)
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) {
      return null
    }

    const durationMs = (minutes * 60 + seconds) * 1000
    return durationMs > 0 ? durationMs : null
  }

  if (!/^\d+$/.test(trimmed)) {
    return null
  }
  const minutes = Number(trimmed)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null
  }
  return minutes * 60_000
}

function ControlPage() {
  const { roomId } = Route.useParams()
  const { remainingMs, snapshot, status, error, sendCommand, sendChime } = useRoomTimer(
    roomId,
    'control',
  )
  const [minutesInput, setMinutesInput] = useState('5:00')
  const [alarmMinuteInputs, setAlarmMinuteInputs] = useState([''])

  const parsedDurationMs = useMemo(
    () => parseDurationInputToMs(minutesInput),
    [minutesInput],
  )
  const canSetDuration = parsedDurationMs !== null
  const parsedAlarmMinutes = useMemo(() => {
    const parsed: number[] = []
    for (const alarmMinuteInput of alarmMinuteInputs) {
      const trimmed = alarmMinuteInput.trim()
      if (trimmed.length === 0) {
        continue
      }
      const elapsedMs = parseDurationInputToMs(trimmed)
      if (elapsedMs === null) {
        return null
      }
      parsed.push(elapsedMs)
    }
    return parsed
  }, [alarmMinuteInputs])
  const applyAlarmSettings = useCallback(() => {
    if (parsedAlarmMinutes === null) {
      return
    }
    sendCommand({
      type: 'set-alarms',
      elapsedMs: parsedAlarmMinutes,
    })
  }, [parsedAlarmMinutes, sendCommand])
  const updateAlarmMinuteInput = (index: number, value: string) => {
    setAlarmMinuteInputs((previous) =>
      previous.map((previousValue, previousIndex) =>
        previousIndex === index ? value : previousValue,
      ),
    )
  }
  const addAlarmMinuteInput = () => {
    setAlarmMinuteInputs((previous) => [...previous, ''])
  }
  const removeAlarmMinuteInput = (index: number) => {
    setAlarmMinuteInputs((previous) => {
      if (previous.length <= 1) {
        return ['']
      }
      return previous.filter((_, previousIndex) => previousIndex !== index)
    })
  }
  const activeAlarmLabel = useMemo(() => {
    if (!snapshot) {
      return '終了時'
    }
    const labels = snapshot.alarmElapsedMs.map((elapsedMs) => formatDuration(elapsedMs))
    return [...labels, '終了時'].join(' / ')
  }, [snapshot])
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
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {snapshot?.isRunning ? (
                <>
                  <Play className="h-4 w-4 fill-cyan-500 text-cyan-500" aria-label="進行中" />
                  <span>進行中</span>
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 fill-slate-500 text-slate-500" aria-label="停止中" />
                  <span>停止中</span>
                </>
              )}
              <span className="ml-1">/ 接続: {status}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <p>
                進行状況:{' '}
                {timelineState ? `${Math.round(timelineState.progressPercent)}%` : '--'}
              </p>
              <p>
                {timelineState
                  ? `${formatDuration(timelineState.elapsedMs)} / ${formatDuration(timelineState.totalDurationMs)}`
                  : '--:-- / --:--'}
              </p>
            </div>
            <div className="relative pt-4 pb-6">
              <div className="absolute top-0 left-0 text-[10px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                START
              </div>
              <div className="absolute top-0 right-0 text-[10px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                END
              </div>
              <div className="relative h-10 rounded bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-10 rounded bg-cyan-500/60 transition-[width] duration-200 dark:bg-cyan-400/70"
                  style={{ width: `${timelineState?.progressPercent ?? 0}%` }}
                />
                {timelineState?.alarmMarkers.map((marker) => (
                  <div
                    key={marker.elapsedMs}
                    className="absolute top-1/2 h-10 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-500 bg-amber-300 dark:border-amber-300 dark:bg-amber-200"
                    style={{ left: `${marker.progressPercent}%` }}
                    title={formatDuration(marker.elapsedMs)}
                  />
                ))}
                <div
                  className="absolute top-1/2 right-0 h-10 w-3 -translate-y-1/2 rounded-full border border-red-600 bg-red-500 dark:border-red-300 dark:bg-red-400"
                  title="終了時"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              鳴動タイミング: {activeAlarmLabel}
            </p>
          </div>
        </section>

        <div className="grid flex-1 gap-6 pt-6 xl:grid-cols-[2fr_1fr]">
          <section className="flex flex-col sm:pr-8 xl:border-r xl:border-slate-300 xl:pr-6 xl:dark:border-slate-700">
            <div className={`flex items-center justify-center gap-4 text-[18vw] leading-none font-extrabold tracking-tight tabular-nums sm:text-[10rem] xl:text-[11rem] ${remainingMs !== null && remainingMs < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {snapshot?.isRunning ? (
                <Play className="h-[0.7em] w-[0.7em] fill-cyan-500 text-cyan-500" aria-label="進行中" />
              ) : (
                <Pause className="h-[0.7em] w-[0.7em] fill-slate-400 text-slate-400 dark:fill-slate-600 dark:text-slate-600" aria-label="停止中" />
              )}
              <p>
                {remainingMs === null ? '--:--' : formatDuration(remainingMs)}
              </p>
            </div>
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
              <button
                type="button"
                onClick={sendChime}
                className="col-span-2 border border-amber-300 bg-amber-100 px-4 py-4 text-lg font-bold text-amber-900 transition hover:bg-amber-200 md:col-span-1 dark:border-amber-700 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30"
              >
                チャイム
              </button>
            </div>
            <div className="mt-auto">
              <Footer />
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
                  inputMode="text"
                  placeholder="例: 05:00"
                  className="w-36 border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-cyan-200 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-cyan-500/40"
                />
                <button
                  type="button"
                  disabled={!canSetDuration}
                  onClick={() =>
                    sendCommand({
                      type: 'set-duration',
                      durationMs: parsedDurationMs ?? 0,
                    })
                  }
                  className="border border-slate-300 bg-white px-5 py-3 text-lg font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  反映
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                `mm:ss`
              </p>
            </section>

            <section className="py-5">
              <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
                鳴動タイミングを設定
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                必要なだけ入力欄を追加して鳴動タイミングを指定します。終了時は常に鳴動します。
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                `mm:ss`
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                現在: {activeAlarmLabel}
              </p>
              <div className="mt-3 grid gap-2">
                {alarmMinuteInputs.map((alarmMinuteInput, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <input
                      value={alarmMinuteInput}
                      onChange={(event) => updateAlarmMinuteInput(index, event.target.value)}
                      onBlur={applyAlarmSettings}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          applyAlarmSettings()
                        }
                      }}
                      inputMode="text"
                      placeholder="例: 03:30"
                      className="w-36 border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none ring-cyan-200 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-cyan-500/40"
                    />
                    <button
                      type="button"
                      disabled={alarmMinuteInputs.length <= 1}
                      onClick={() => removeAlarmMinuteInput(index)}
                      className="border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      削除
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={addAlarmMinuteInput}
                    className="border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    + 入力欄を追加
                  </button>
                </div>
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
