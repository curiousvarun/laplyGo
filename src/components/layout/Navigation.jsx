import {
  BarChart3,
  History,
  Hourglass,
  Settings as SettingsIcon,
  Timer,
} from 'lucide-react'
import { cx } from '../../utils/cx.js'

const ITEMS = [
  { id: 'stopwatch', label: 'Stopwatch', icon: Timer },
  { id: 'timer', label: 'Timer', icon: Hourglass },
  { id: 'history', label: 'History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

/**
 * Universal segmented switcher.
 * Top variant: header navigation. Bottom variant: mobile tab bar.
 */
export function Navigation({
  activeView,
  onNavigate,
  variant = 'top',
  showRunningDot = false,
  runningView = null,
  className,
}) {
  const isBottom = variant === 'bottom'

  if (isBottom) {
    return (
      <nav
        aria-label="Mobile navigation"
        className={cx(
          'fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#09090b]/95',
          className,
        )}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-2 py-1">
          {ITEMS.map((item) => {
            const active = item.id === activeView
            const Icon = item.icon
            const showDot = showRunningDot && item.id === runningView

            return (
              <li key={item.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:text-[11px]',
                    active
                      ? 'font-bold text-zinc-950 dark:text-white'
                      : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300',
                  )}
                >
                  <span className="relative">
                    <Icon className="size-5" aria-hidden="true" strokeWidth={active ? 2.3 : 1.8} />
                    {showDot && (
                      <span className="absolute -right-1 -top-0.5 flex size-2" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                      </span>
                    )}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }

  return (
    <nav aria-label="Main sections" className={className}>
      <ul className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200/80 bg-zinc-100/90 p-1 backdrop-blur-xs dark:border-zinc-800/80 dark:bg-zinc-900/90 lg:gap-1">
        {ITEMS.map((item) => {
          const active = item.id === activeView
          const Icon = item.icon
          const showDot = showRunningDot && item.id === runningView

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 lg:px-3.5 lg:text-xs',
                  active
                    ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                )}
              >
                <span className="relative">
                  <Icon className="size-3.5" aria-hidden="true" strokeWidth={active ? 2.2 : 1.8} />
                  {showDot && (
                    <span className="absolute -right-1 -top-0.5 flex size-2" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
