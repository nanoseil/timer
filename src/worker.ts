import handler from "@tanstack/react-start/server-entry";

// Export Durable Objects as named exports
export { TimerHandler } from "./server/timer";

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const match = url.pathname.match(/^\/api\/rooms\/([^/]+)\/ws$/);
        if (match) {
            const roomId = decodeURIComponent(match[1]);
            const id = env.TIMER_DO.idFromName(roomId);
            const timer = env.TIMER_DO.get(id);
            return timer.fetch(request);
        }
        return handler.fetch(request);
    },
} as ExportedHandler<Env>;
