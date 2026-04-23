import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ClientRole, TimerServerMessage } from './protocol'
import type { TimerCommand, TimerSnapshot } from './timerState'

function createWebSocketUrl(roomId: string, role: ClientRole): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const roomPath = encodeURIComponent(roomId)
  return `${protocol}//${window.location.host}/api/rooms/${roomPath}/ws?role=${role}`
}

function computeRemainingMs(snapshot: TimerSnapshot, nowMs: number): number {
  if (!snapshot.isRunning) {
    return snapshot.remainingMs
  }
  return Math.max(0, snapshot.remainingMs - Math.max(0, nowMs - snapshot.serverNowMs))
}

function playAlarmSound() {
  if (typeof window === 'undefined') {
    return
  }

  const AudioContextCtor = window.AudioContext
  if (!AudioContextCtor) {
    return
  }

  try {
    const context = new AudioContextCtor()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'square'
    oscillator.frequency.value = 880
    gain.gain.value = 0.2
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.2)
    oscillator.addEventListener('ended', () => {
      context.close().catch(() => {})
    })
  } catch {
    // ignore
  }
}

export type ConnectionStatus = 'connecting' | 'open' | 'closed'

export function useRoomTimer(roomId: string, role: ClientRole) {
  const [snapshot, setSnapshot] = useState<TimerSnapshot | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const previousRemainingMsRef = useRef<number | null>(null)
  const wasRunningRef = useRef(false)
  const firedElapsedMsRef = useRef<Set<number>>(new Set())

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let disposed = false

    const connect = () => {
      const url = createWebSocketUrl(roomId, role)
      if (!url || disposed) {
        return
      }

      setStatus('connecting')
      const socket = new WebSocket(url)
      socketRef.current = socket

      socket.addEventListener('open', () => {
        if (disposed) {
          return
        }
        setStatus('open')
        setError(null)
      })

      socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') {
          return
        }

        let payload: TimerServerMessage
        try {
          payload = JSON.parse(event.data) as TimerServerMessage
        } catch {
          setError('サーバーメッセージの解析に失敗しました。')
          return
        }

        if (payload.type === 'snapshot') {
          setSnapshot(payload.snapshot)
          setNowMs(Date.now())
          setError(null)
          return
        }

        setError(payload.message)
      })

      socket.addEventListener('close', () => {
        if (disposed) {
          return
        }
        setStatus('closed')
        clearReconnectTimer()
        reconnectTimerRef.current = window.setTimeout(connect, 1000)
      })

      socket.addEventListener('error', () => {
        if (!disposed) {
          setStatus('closed')
          setError('接続エラーが発生しました。再接続を試みます。')
        }
      })
    }

    connect()

    return () => {
      disposed = true
      clearReconnectTimer()
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [clearReconnectTimer, role, roomId])

  useEffect(() => {
    if (!snapshot?.isRunning) {
      return
    }
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 200)
    return () => window.clearInterval(intervalId)
  }, [snapshot?.isRunning])

  const sendCommand = useCallback((command: TimerCommand) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('接続中のため操作できません。')
      return
    }

    socket.send(
      JSON.stringify({
        type: 'command',
        command,
      }),
    )
  }, [])

  const remainingMs = useMemo(() => {
    if (!snapshot) {
      return null
    }
    return computeRemainingMs(snapshot, nowMs)
  }, [snapshot, nowMs])

  useEffect(() => {
    if (!snapshot || remainingMs === null) {
      return
    }

    if (!snapshot.isRunning && snapshot.remainingMs === snapshot.totalDurationMs) {
      firedElapsedMsRef.current.clear()
    }

    const startedFresh =
      snapshot.isRunning &&
      !wasRunningRef.current &&
      snapshot.remainingMs === snapshot.totalDurationMs
    if (startedFresh) {
      firedElapsedMsRef.current.clear()
    }
    wasRunningRef.current = snapshot.isRunning

    if (!snapshot.isRunning) {
      previousRemainingMsRef.current = remainingMs
      return
    }

    const previousRemainingMs = previousRemainingMsRef.current
    if (previousRemainingMs === null) {
      previousRemainingMsRef.current = remainingMs
      return
    }

    const alarmElapsedMs = [...snapshot.alarmElapsedMs, snapshot.totalDurationMs]
    for (const elapsedMs of alarmElapsedMs) {
      const thresholdRemainingMs = Math.max(0, snapshot.totalDurationMs - elapsedMs)
      const hasCrossed =
        previousRemainingMs > thresholdRemainingMs &&
        remainingMs <= thresholdRemainingMs
      if (!hasCrossed || firedElapsedMsRef.current.has(elapsedMs)) {
        continue
      }
      firedElapsedMsRef.current.add(elapsedMs)
      playAlarmSound()
    }

    previousRemainingMsRef.current = remainingMs
  }, [remainingMs, snapshot])

  return {
    snapshot,
    remainingMs,
    status,
    error,
    sendCommand,
  }
}
