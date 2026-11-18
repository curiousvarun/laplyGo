import { Loader2, Moon, Sun, UserRound } from 'lucide-react'
import { APP_NAME } from '../../constants.js'
import { cx } from '../../utils/cx.js'
import { LaplyLogo } from '../brand/LaplyLogo.jsx'
import { Navigation } from './Navigation.jsx'

function initials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return 'L'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function TopBar({
  activeView,
  onNavigate,
  onOpenStopwatch,
  showRunningDot = false,
  runningView = null,
  isDark,
  onToggleTheme,
  user,
  onOpenAuth,
  syncing,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[#f7f7f4]/85 backdrop-blur-md transition-colors dark:border-zinc-800/80 dark:bg-[#09090b]/85">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenStopwatch}
          className="group flex shrink-0 items-center gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`${APP_NAME} — open stopwatch`}
        >
          <LaplyLogo size={34} />
        </button>

        <div className="hidden md:block">
          <Navigation
            activeView={activeView}
            onNavigate={onNavigate}
            showRunningDot={showRunningDot}
            runningView={runningView}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="grid size-9 place-items-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            {isDark ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAuth}
            aria-label={
              user
                ? `Account for ${user.name}. Open sync settings.`
                : 'Sign in to sync your history'
            }
            className={cx(
              'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500',
              user
                ? 'border border-zinc-200/80 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                : 'bg-zinc-900 text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100',
            )}
          >
            {user ? (
              <span className="relative grid size-5 place-items-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-950">
                {initials(user.name)}
                {syncing ? (
                  <Loader2
                    className="absolute -right-1 -top-1 size-2.5 animate-spin text-indigo-500"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-500"
                  />
                )}
              </span>
            ) : (
              <UserRound className="size-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
