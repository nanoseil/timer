import type { ClientRole, TimerServerMessage } from '#/features/timer/protocol'
import { parseTimerClientMessage } from '#/features/timer/protocol'
import {
    applyTimerCommand,
    createDefaultTimerState,
    createTimerSnapshot,
    normalizeAlarmElapsedMs,
    type RoomTimerState,
} from '#/features/timer/timerState'
import { DurableObject } from 'cloudflare:workers'

const TIMER_STATE_KEY = 'timer-state'

function toPayload(message: TimerServerMessage): string {
    return JSON.stringify(message)
}

function parseRole(url: URL): ClientRole {
    const role = url.searchParams.get('role')
    return role === 'control' ? 'control' : 'display'
}

function getRoleFromSocket(ctx: DurableObjectState, ws: WebSocket): ClientRole {
    const tags = ctx.getTags(ws)
    return tags.includes('control') ? 'control' : 'display'
}

function isRoomTimerState(value: unknown): value is RoomTimerState {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const candidate = value as Record<string, unknown>
    return (
        typeof candidate.totalDurationMs === 'number' &&
        typeof candidate.remainingMs === 'number' &&
        typeof candidate.isRunning === 'boolean' &&
        (typeof candidate.startedAtMs === 'number' || candidate.startedAtMs === null) &&
        (candidate.alarmElapsedMs === undefined ||
            (Array.isArray(candidate.alarmElapsedMs) &&
                candidate.alarmElapsedMs.every((elapsedMs) => typeof elapsedMs === 'number'))) &&
        typeof candidate.revision === 'number'
    )
}

export class TimerHandler extends DurableObject<Env> {
    private timerState: RoomTimerState = createDefaultTimerState()

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env)

        this.ctx.blockConcurrencyWhile(async () => {
            const stored = await this.ctx.storage.get<unknown>(TIMER_STATE_KEY)
            if (isRoomTimerState(stored)) {
                this.timerState = {
                    ...stored,
                    alarmElapsedMs: normalizeAlarmElapsedMs(
                        stored.alarmElapsedMs ?? [],
                        stored.totalDurationMs,
                    ),
                }
            }
        })
    }

    async fetch(request: Request): Promise<Response> {
        if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
            return new Response('WebSocket upgrade required', { status: 426 })
        }

        const role = parseRole(new URL(request.url))
        const pair = new WebSocketPair()
        const [client, server] = Object.values(pair) as [WebSocket, WebSocket]
        this.ctx.acceptWebSocket(server, [role])
        this.emitSnapshot(server)

        return new Response(null, { status: 101, webSocket: client })
    }

    async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
        if (typeof message !== 'string') {
            this.sendError(ws, 'Only JSON text messages are supported.')
            return
        }

        let parsed: unknown
        try {
            parsed = JSON.parse(message) as unknown
        } catch {
            this.sendError(ws, 'Malformed JSON message.')
            return
        }

        const payload = parseTimerClientMessage(parsed)
        if (!payload) {
            this.sendError(ws, 'Invalid command payload.')
            return
        }

        if (getRoleFromSocket(this.ctx, ws) !== 'control') {
            this.sendError(ws, 'Display clients cannot send commands.')
            return
        }

        this.timerState = applyTimerCommand(this.timerState, payload.command, Date.now())
        await this.ctx.storage.put(TIMER_STATE_KEY, this.timerState)
        this.broadcastSnapshot()
    }

    async webSocketClose() {
        if (this.ctx.getWebSockets().length === 0) {
            await this.ctx.storage.delete(TIMER_STATE_KEY)
        }
    }

    async webSocketError() {
        if (this.ctx.getWebSockets().length === 0) {
            await this.ctx.storage.delete(TIMER_STATE_KEY)
        }
    }

    private sendError(target: WebSocket, message: string) {
        if (target.readyState !== WebSocket.OPEN) {
            return
        }
        target.send(
            toPayload({
                type: 'error',
                message,
            }),
        )
    }

    private emitSnapshot(target: WebSocket) {
        const nowMs = Date.now()
        const { nextState, snapshot } = createTimerSnapshot(this.timerState, nowMs)
        this.timerState = nextState

        if (target.readyState !== WebSocket.OPEN) {
            return
        }
        target.send(
            toPayload({
                type: 'snapshot',
                snapshot,
            }),
        )
    }

    private broadcastSnapshot() {
        const nowMs = Date.now()
        const { nextState, snapshot } = createTimerSnapshot(this.timerState, nowMs)
        this.timerState = nextState
        const payload = toPayload({
            type: 'snapshot',
            snapshot,
        })

        for (const socket of this.ctx.getWebSockets()) {
            if (socket.readyState !== WebSocket.OPEN) {
                continue
            }
            socket.send(payload)
        }
    }
}
