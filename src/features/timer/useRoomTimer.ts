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

export type ConnectionStatus = 'connecting' | 'open' | 'closed'

export function useRoomTimer(roomId: string, role: ClientRole) {
  const [snapshot, setSnapshot] = useState<TimerSnapshot | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)

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

  return {
    snapshot,
    remainingMs,
    status,
    error,
    sendCommand,
  }
}

