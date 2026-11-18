import { useId } from 'react'
import { Sprout, Sparkles } from 'lucide-react'
import { formatDurationShort } from '../../utils/timeFormatters.js'
import { getFocusWorld } from '../../utils/focusWorld.js'
import { cx } from '../../utils/cx.js'

function Plant({ plant, index, animate }) {
  const delay = `${(index % 5) * 0.65}s`

  return (
    <g
      transform={`translate(${plant.x} 188) scale(${plant.scale})`}
      className={animate ? 'focus-world-sway' : undefined}
      style={animate ? { animationDelay: delay } : undefined}
    >
      {plant.type === 'tree' && (
        <>
          <rect x="-3" y="-36" width="6" height="36" rx="3" fill="#7c5c42" />
          <circle cx="0" cy="-49" r="21" fill="#4d9a70" />
          <circle cx="-13" cy="-39" r="15" fill="#62ac7d" />
          <circle cx="14" cy="-40" r="16" fill="#3f8a62" />
          <circle cx="2" cy="-61" r="13" fill="#75bb8a" />
        </>
      )}

      {plant.type === 'flower' && (
        <>
          <path d="M0 0v-30" stroke="#4d8a5d" strokeWidth="3" strokeLinecap="round" />
          <path d="M0-14c-8-2-12-7-12-12 8-1 13 3 12 12Z" fill="#67a977" />
          <path d="M0-20c7-1 11-6 11-11-7-1-12 3-11 11Z" fill="#82bd8d" />
          <circle cx="0" cy="-36" r="5" fill="#f6c453" />
          <circle cx="-7" cy="-39" r="6" fill="#f7a8c4" />
          <circle cx="7" cy="-39" r="6" fill="#f7a8c4" />
          <circle cx="0" cy="-46" r="6" fill="#fbcfe8" />
          <circle cx="0" cy="-32" r="6" fill="#f9b8d0" />
        </>
      )}

      {plant.type === 'sprout' && (
        <>
          <path d="M0 0v-18" stroke="#4d8a5d" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M0-10c-10 0-15-6-15-13 9 0 15 5 15 13Z" fill="#6db17d" />
          <path d="M0-14c9 0 14-6 14-13-9 0-14 5-14 13Z" fill="#8ac797" />
        </>
      )}
    </g>
  )
}

export function FocusWorldScene({ world, animate = true, className }) {
  const gradientId = useId().replaceAll(':', '')
  const [skyTop, skyBottom] = world.level.sky
  const isStarlit = Boolean(world.level.stars)

  return (
    <svg
      viewBox="0 0 460 220"
      role="img"
      aria-label={`Your focus world: ${world.level.name}. ${world.level.description}`}
      className={cx('h-auto w-full', className)}
    >
      <defs>
        <linearGradient id={`sky-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
      </defs>

      <rect width="460" height="220" rx="22" fill={`url(#sky-${gradientId})`} />

      {isStarlit ? (
        <g fill="#f8fafc" opacity="0.85">
          <circle cx="54" cy="38" r="1.6" />
          <circle cx="104" cy="64" r="1.1" />
          <circle cx="156" cy="30" r="1.4" />
          <circle cx="216" cy="52" r="1.2" />
          <circle cx="286" cy="28" r="1.5" />
          <circle cx="334" cy="62" r="1.1" />
          <circle cx="398" cy="36" r="1.7" />
          <circle cx="74" cy="92" r="1" />
          <circle cx="252" cy="88" r="1" />
          <circle cx="424" cy="84" r="1.1" />
        </g>
      ) : (
        <g>
          <circle cx="382" cy="48" r="24" fill={world.level.sun} opacity="0.9" />
          <circle cx="382" cy="48" r="34" fill={world.level.sun} opacity="0.16" />
          <g fill="#ffffff" opacity="0.52">
            <ellipse cx="92" cy="55" rx="28" ry="11" />
            <ellipse cx="112" cy="50" rx="20" ry="12" />
            <ellipse cx="296" cy="78" rx="22" ry="8" />
          </g>
        </g>
      )}

      <path
        d="M0 162c54-25 97-20 141-2 46 19 87 15 132-6 50-23 103-23 187 4v62H0Z"
        fill={world.level.hill}
      />
      <path
        d="M0 185c61-16 110-12 165 2 61 16 110 11 165-4 46-13 87-11 130 2v35H0Z"
        fill={world.level.soil}
      />

      {world.plants.map((plant, index) => (
        <Plant
          key={`${plant.x}-${plant.type}`}
          plant={plant}
          index={index}
          animate={animate}
        />
      ))}

      {world.levelIndex === 0 && (
        <g>
          <ellipse cx="226" cy="196" rx="16" ry="4" fill="#8f765c" opacity="0.35" />
          <ellipse cx="226" cy="193" rx="6" ry="7" fill="#9b7d5f" />
          <path d="M226 187v7" stroke="#6f9a72" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

export function FocusWorldCard({
  sessions,
  liveFocusMs = 0,
  enabled = true,
  animate = true,
  className,
}) {
  if (!enabled) return null

  const world = getFocusWorld(sessions, liveFocusMs)
  const nextLabel = world.next
    ? `${world.minutesToNext} min to ${world.next.name}`
    : 'Your world is fully grown'

  return (
    <section
      aria-label="Your Focus World"
      className={cx(
        'overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/70 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/40',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200/70 p-5 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Sprout className="size-[19px]" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Your Focus World
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold tracking-tight">
              {world.level.name}
            </h2>
            <p className="mt-0.5 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {world.level.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 text-xs font-bold tabular-nums text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-300">
          <Sparkles className="size-3.5 text-emerald-500" aria-hidden="true" />
          {formatDurationShort(world.totalFocusMs)} focused
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <FocusWorldScene world={world} animate={animate} className="rounded-[1.25rem] shadow-xs" />

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              {nextLabel}
            </span>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {Math.round(world.progress * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${Math.max(3, world.progress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            Grown by {world.completedSessions}{' '}
            {world.completedSessions === 1 ? 'focus session' : 'focus sessions'}.
            Nothing wilts if you rest.
          </p>
        </div>
      </div>
    </section>
  )
}
