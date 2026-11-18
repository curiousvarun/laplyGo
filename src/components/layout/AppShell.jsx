import { Navigation } from './Navigation.jsx'

export function AppShell({
  topBar,
  children,
  activeView,
  onNavigate,
  showRunningDot,
  runningView,
  zenMode = false,
}) {
  if (zenMode) {
    return <div className="min-h-screen w-full bg-[#09090b] text-zinc-50">{children}</div>
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-[#f7f7f4] text-zinc-900 transition-colors dark:bg-[#09090b] dark:text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(58%_58%_at_50%_0%,rgba(99,102,241,0.09),transparent_72%)] dark:bg-[radial-gradient(58%_58%_at_50%_0%,rgba(99,102,241,0.13),transparent_72%)]"
      />

      {topBar}

      <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-4 pb-28 pt-6 sm:px-6 sm:pt-10 md:pb-16">
        {children}
      </main>

      <Navigation
        variant="bottom"
        className="md:hidden"
        activeView={activeView}
        onNavigate={onNavigate}
        showRunningDot={showRunningDot}
        runningView={runningView}
      />
    </div>
  )
}
