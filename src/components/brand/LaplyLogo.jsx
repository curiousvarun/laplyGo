import { useId } from 'react'
import { cx } from '../../utils/cx.js'

/**
 * LaplyGo mark: a lap ring wrapped around a stopwatch crown.
 * Pure geometry, no raster assets, and safe at 20px.
 */
export function LaplyLogoIcon({ className, title = 'LaplyGo', style }) {
  const gradientId = useId().replaceAll(':', '')

  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cx('shrink-0', className)}
      style={style}
    >
      <defs>
        <linearGradient
          id={`laply-${gradientId}`}
          x1="4"
          y1="2"
          x2="44"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#laply-${gradientId})`} />
      <path
        d="M20 9h8"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M24 9v4.4"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle
        cx="24"
        cy="27"
        r="11.5"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="3"
      />
      <path
        d="M24 15.5a11.5 11.5 0 0 1 10.4 16.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M24 27v-6.2"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="27" r="2.3" fill="#a5f3fc" />
      <path
        d="M35.6 14.8l2.2-2.2"
        stroke="#a5f3fc"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LaplyLogo({ size = 36, showWordmark = true, className }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <LaplyLogoIcon
        className="shadow-sm shadow-indigo-950/20 transition-transform group-hover:scale-105"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="text-[1.05rem] font-extrabold tracking-[-0.045em] text-zinc-950 dark:text-white">
          Laply<span className="text-indigo-600 dark:text-indigo-400">Go</span>
        </span>
      )}
    </span>
  )
}
