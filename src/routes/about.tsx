import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 text-xs font-bold tracking-[0.16em] text-cyan-700 uppercase dark:text-cyan-300">
          About
        </p>
        <h1 className="mb-3 text-4xl font-bold text-slate-900 sm:text-5xl dark:text-slate-100">
          A small starter with room to grow.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </p>
      </section>
    </main>
  )
}
