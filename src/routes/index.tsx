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
    <main className="mx-auto flex flex-col min-h-screen w-full max-w-5xl px-4 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="text-center mb-16 mt-8 sm:mt-12">
        <div className="inline-flex items-center justify-center px-3 py-1 mb-6 text-sm font-medium rounded-full bg-cyan-100/50 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300 ring-1 ring-inset ring-cyan-500/20">
          無料で使える・登録不要
        </div>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-100">
          スマホが<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">リモコン</span>になる。<br className="hidden sm:block" />
          ブラウザで動くプレゼンタイマー。
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          Presentation Timerは、インストール不要ですぐに使える同期型タイマーです。<br className="hidden sm:block" />
          勉強会やライトニングトークで、手元のスマホから時間をコントロールしよう。
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 px-4 py-2 rounded-full transition-transform hover:-translate-y-0.5">
            <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            インストール不要
          </div>
          <div className="flex items-center gap-1.5 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 px-4 py-2 rounded-full transition-transform hover:-translate-y-0.5">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            スマホで簡単操作
          </div>
          <div className="flex items-center gap-1.5 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 px-4 py-2 rounded-full transition-transform hover:-translate-y-0.5">
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            リアルタイム同期
          </div>
        </div>
      </section>

      {/* Main Workspace Section */}
      <section className="rounded-3xl border border-slate-200 bg-white/50 p-6 shadow-xl sm:p-10 dark:border-slate-800/50 dark:bg-slate-900/50 mb-16 relative overflow-hidden backdrop-blur-xl ring-1 ring-white/50 dark:ring-white/10 mx-auto w-full max-w-4xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>

        <div className="relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              さっそく使ってみる
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              ルームを作成するか、共有されたルームIDを入力してください。
            </p>
          </div>

          <div className="grid w-full gap-6 md:grid-cols-2">
            {/* Create Room */}
            <section className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">
                新しく始める
              </h3>
              <p className="mb-6 mt-2 text-sm text-slate-600 dark:text-slate-400">
                新しいルームIDを作成して、表示用・操作用のリンクを取得します。
              </p>
              <button
                type="button"
                onClick={() => setNewRoomId(createRoomId())}
                className="w-full rounded-xl border border-transparent bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-cyan-700 shadow-sm dark:bg-cyan-600 dark:hover:bg-cyan-500"
              >
                ルームを作成
              </button>
              {cleanNewRoomId ? (
                <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/50 dark:bg-slate-800/50 dark:ring-slate-700/50">
                  <p className="m-0 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>ルームID</span>
                    <code className="px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400 font-mono">
                      {cleanNewRoomId}
                    </code>
                  </p>
                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href={`/room/${cleanNewRoomId}/display`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      表示画面を開く
                    </a>
                    <a
                      href={`/room/${cleanNewRoomId}/control`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      操作画面を開く
                    </a>
                  </div>
                </div>
              ) : null}
            </section>

            {/* Join Room */}
            <section className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">
                既存ルームに参加
              </h3>
              <p className="mb-6 mt-2 text-sm text-slate-600 dark:text-slate-400">
                共有されたルームIDを入力して、タイマーに接続します。
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    ルームID
                  </label>
                  <input
                    value={joinRoomId}
                    onChange={(event) => setJoinRoomId(event.target.value)}
                    placeholder="例: 9f2a4b1c"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/20 transition focus:border-indigo-500 focus:ring-4 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:dark:border-indigo-400 max-w-full font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={cleanJoinRoomId ? `/room/${cleanJoinRoomId}/display` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                  >
                    表示画面
                  </a>
                  <a
                    href={cleanJoinRoomId ? `/room/${cleanJoinRoomId}/control` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                  >
                    操作画面
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-16 max-w-5xl mx-auto">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 shadow-sm transition hover:shadow-md hover:-translate-y-1 group">
          <div className="w-12 h-12 inline-flex items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 mb-5 transition-transform group-hover:scale-110">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">ブラウザだけで完結</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            アプリのインストールや面倒なアカウント登録は一切不要。URLを共有するだけで、どの端末からでもすぐに利用を開始できます。
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 shadow-sm transition hover:shadow-md hover:-translate-y-1 group">
          <div className="w-12 h-12 inline-flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-5 transition-transform group-hover:scale-110">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">手元のスマホがリモコンに</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            メインプロジェクターでタイマーを表示しながら、発表者は手元のスマートフォンを使ってタイマーの開始・停止・リセットを行えます。
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 shadow-sm transition hover:shadow-md hover:-translate-y-1 group">
          <div className="w-12 h-12 inline-flex items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-5 transition-transform group-hover:scale-110">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">リアルタイム同期</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            最新のWeb技術を使用し、操作端末と表示端末でミリ秒単位でのタイマー同期を実現。ズレのない快適な進行をサポートします。
          </p>
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </main>
  )
}

