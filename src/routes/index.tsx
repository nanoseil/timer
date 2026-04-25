import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import Footer from '../components/Footer'

export const Route = createFileRoute('/')({ component: App })

function createRoomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

function sanitizeRoomId(raw: string): string {
  return raw.trim().replaceAll('/', '-').slice(0, 64)
}

function App() {
  const [newRoomId, setNewRoomId] = useState<string>('')
  const [joinRoomId, setJoinRoomId] = useState<string>('')

  const cleanJoinRoomId = sanitizeRoomId(joinRoomId)
  const cleanNewRoomId = sanitizeRoomId(newRoomId)

  return (
    <main className="mx-auto flex flex-col min-h-screen w-full max-w-3xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Presentation Timer
        </h1>
        <p className="mb-6 text-base text-slate-600 dark:text-slate-300">
          ルームを作成または参加して、表示端末と操作端末を開いてください。
        </p>
        <div className="grid w-full gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
              ルームを作成
            </h2>
            <p className="mb-4 mt-2 text-sm text-slate-600 dark:text-slate-300">
              新しいルームIDを作成して、表示・操作リンクを共有します。
            </p>
            <button
              type="button"
              onClick={() => setNewRoomId(createRoomId())}
              className="rounded-full border border-cyan-300 bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:-translate-y-0.5 hover:bg-cyan-200 dark:border-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200 dark:hover:bg-cyan-500/30"
            >
              ルームIDを生成
            </button>
            {cleanNewRoomId ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="m-0 text-slate-600 dark:text-slate-300">
                  ルームID: <code>{cleanNewRoomId}</code>
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/room/${cleanNewRoomId}/display`}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 no-underline transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    表示画面を開く
                  </a>
                  <a
                    href={`/room/${cleanNewRoomId}/control`}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 no-underline transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    操作画面を開く
                  </a>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
              既存ルームに参加
            </h2>
            <p className="mb-4 mt-2 text-sm text-slate-600 dark:text-slate-300">
              共有されたルームIDを入力して接続します。
            </p>
            <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
              ルームID
            </label>
            <input
              value={joinRoomId}
              onChange={(event) => setJoinRoomId(event.target.value)}
              placeholder="例: 9f2a4b1c"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-200 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-cyan-500/40"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={cleanJoinRoomId ? `/room/${cleanJoinRoomId}/display` : '#'}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                表示画面へ
              </a>
              <a
                href={cleanJoinRoomId ? `/room/${cleanJoinRoomId}/control` : '#'}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                操作画面へ
              </a>
            </div>
          </section>
        </div>
      </section>
      <div className="flex-1" />
      <Footer />
    </main>
  )
}
