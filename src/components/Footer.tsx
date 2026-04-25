export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full border-t mt-4 border-slate-200 p-4 text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="flex items-center justify-center gap-3">
        <img src="/Logo_Light.svg" alt="Nanoseil" className="h-8 w-auto dark:hidden" />
        <img src="/Logo_Dark.svg" alt="Nanoseil" className="h-8 w-auto hidden dark:block" />
        <p>&copy; {year} Nanoseil</p>
      </div>
    </footer>
  )
}
