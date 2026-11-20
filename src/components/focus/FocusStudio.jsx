import { useId, useState } from 'react'
import {
  Building2,
  Check,
  ChevronDown,
  CloudRain,
  Crown,
  Lock,
  Moon,
  Mountain,
  Sparkles,
} from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { cx } from '../../utils/cx.js'
import { formatDurationShort } from '../../utils/timeFormatters.js'
import {
  STUDIO_STAGES,
  STUDIO_THEMES,
  getStudioProgress,
} from '../../data/studioStages.js'

const THEME_ICONS = {
  'midnight-loft': Moon,
  'tokyo-rain': CloudRain,
  'himalayan-cabin': Mountain,
}

const STATUS = {
  focusing: {
    label: 'Focusing',
    pill: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    dot: 'bg-emerald-400',
    ping: true,
  },
  resting: {
    label: 'Resting',
    pill: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
    dot: 'bg-amber-400',
    ping: false,
  },
  idle: {
    label: 'Studio ready',
    pill: 'border-white/10 bg-white/5 text-zinc-300',
    dot: 'bg-zinc-400',
    ping: false,
  },
}

/** Deterministic pseudo-random fields keep SSR and client output identical. */
function seededField(count, seed, mapper) {
  let value = seed
  return Array.from({ length: count }, (_, index) => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return mapper(value / 4294967296, index)
  })
}

const STARS = seededField(34, 19, (random) => ({
  x: 94 + random * 252,
  y: 52 + random * 104,
  r: 0.55 + random * 1.15,
  delay: random * 6,
  duration: 3.4 + random * 3.4,
  opacity: 0.35 + random * 0.55,
}))

const RAIN = seededField(26, 47, (random) => ({
  x: 94 + random * 252,
  y: 48 + random * 156,
  length: 8 + random * 12,
  delay: random * 1.8,
  duration: 0.9 + random * 0.8,
  opacity: 0.15 + random * 0.3,
}))

const SNOW = seededField(22, 71, (random) => ({
  x: 94 + random * 252,
  y: 48 + random * 148,
  r: 0.8 + random * 1.4,
  delay: random * 9,
  duration: 7 + random * 6,
  opacity: 0.35 + random * 0.45,
}))

const DUST = seededField(10, 113, (random) => ({
  x: 470 + random * 220,
  y: 188 + random * 44,
  r: 0.5 + random * 0.9,
  delay: random * 8,
  duration: 10 + random * 8,
}))

const CITY_BUILDINGS = [
  { x: 92, y: 176, w: 12, h: 40 },
  { x: 106, y: 166, w: 16, h: 50 },
  { x: 124, y: 184, w: 10, h: 32 },
  { x: 136, y: 158, w: 18, h: 58 },
  { x: 156, y: 172, w: 14, h: 44 },
  { x: 172, y: 190, w: 12, h: 26 },
  { x: 186, y: 150, w: 20, h: 66 },
  { x: 208, y: 178, w: 14, h: 38 },
  { x: 224, y: 164, w: 18, h: 52 },
  { x: 244, y: 186, w: 12, h: 30 },
  { x: 258, y: 170, w: 16, h: 46 },
  { x: 276, y: 156, w: 20, h: 60 },
  { x: 298, y: 182, w: 12, h: 34 },
  { x: 312, y: 168, w: 16, h: 48 },
  { x: 330, y: 188, w: 18, h: 28 },
]

const STRING_BULBS = [
  { x: 30, y: 25 },
  { x: 80, y: 33 },
  { x: 130, y: 39 },
  { x: 180, y: 42 },
  { x: 230, y: 41 },
  { x: 280, y: 36 },
  { x: 330, y: 29 },
  { x: 380, y: 24 },
  { x: 430, y: 21 },
  { x: 480, y: 20 },
  { x: 530, y: 19 },
  { x: 580, y: 18 },
  { x: 630, y: 17 },
  { x: 680, y: 16 },
]

const SHELF_BOOKS = [
  { x: 22, y: 94, w: 5, h: 18, color: '#34d399' },
  { x: 28, y: 90, w: 5, h: 22, color: '#f59e0b' },
  { x: 34, y: 96, w: 6, h: 16, color: '#60a5fa' },
  { x: 41, y: 92, w: 5, h: 20, color: '#f472b6' },
  { x: 47, y: 98, w: 6, h: 14, color: '#a78bfa' },
  { x: 24, y: 132, w: 6, h: 18, color: '#2dd4bf' },
  { x: 31, y: 128, w: 5, h: 22, color: '#fb923c' },
  { x: 37, y: 136, w: 6, h: 14, color: '#818cf8' },
  { x: 44, y: 130, w: 5, h: 20, color: '#34d399' },
  { x: 50, y: 134, w: 7, h: 16, color: '#f59e0b' },
  { x: 22, y: 170, w: 6, h: 18, color: '#f472b6' },
  { x: 29, y: 166, w: 5, h: 22, color: '#60a5fa' },
  { x: 35, y: 174, w: 6, h: 14, color: '#34d399' },
  { x: 42, y: 168, w: 5, h: 20, color: '#a78bfa' },
  { x: 48, y: 172, w: 7, h: 16, color: '#fb923c' },
  { x: 24, y: 218, w: 6, h: 18, color: '#f59e0b' },
  { x: 31, y: 214, w: 5, h: 22, color: '#2dd4bf' },
  { x: 37, y: 222, w: 6, h: 14, color: '#818cf8' },
  { x: 44, y: 216, w: 5, h: 20, color: '#f472b6' },
  { x: 50, y: 220, w: 7, h: 16, color: '#34d399' },
]

function StatusPill({ status, totalFocusMs }) {
  const config = STATUS[status] ?? STATUS.idle

  return (
    <span
      role="status"
      aria-live="polite"
      className={cx(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold',
        config.pill,
      )}
    >
      <span className="relative flex size-1.5">
        {config.ping && (
          <span
            aria-hidden="true"
            className={cx(
              'absolute inline-flex size-full animate-ping rounded-full opacity-60',
              config.dot,
            )}
          />
        )}
        <span
          aria-hidden="true"
          className={cx('relative inline-flex size-1.5 rounded-full', config.dot)}
        />
      </span>
      {config.label}
      <span className="font-semibold tabular-nums text-white/55">
        • {formatDurationShort(totalFocusMs)}
      </span>
    </span>
  )
}

function ThemeSwitcher({ activeTheme, onSelect }) {
  return (
    <div
      role="group"
      aria-label="Studio environment"
      className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded-full border border-white/10 bg-black/40 p-0.5 backdrop-blur-md"
    >
      {STUDIO_THEMES.map((theme) => {
        const Icon = THEME_ICONS[theme.id] ?? Moon
        const active = activeTheme.id === theme.id

        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelect(theme)}
            aria-pressed={active}
            title={`${theme.name}${theme.locked ? ' — Pro preview' : ''}`}
            className={cx(
              'inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
              active
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
            <span className="hidden md:inline">{theme.shortName}</span>
            {theme.locked && (
              <Lock className="size-2.5 opacity-60" aria-hidden="true" />
            )}
          </button>
        )
      })}
    </div>
  )
}

function StudioScene({ stageIndex, theme, status, animate }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (name) => `${name}-${rawId}`
  const isResting = status === 'resting'
  const isBlueprint = stageIndex === 0

  const reveal = (stage) => ({
    opacity: stageIndex >= stage ? 1 : 0,
    transition: 'opacity 700ms ease',
  })
  const blueprintReveal = {
    opacity: isBlueprint ? 1 : 0,
    transition: 'opacity 700ms ease',
  }

  return (
    <svg
      viewBox="0 0 720 300"
      role="img"
      aria-label={`${theme.name} focus studio at stage ${stageIndex + 1}: ${
        STUDIO_STAGES[stageIndex].name
      }. ${theme.blurb}`}
      focusable="false"
      className={cx(
        'studio-scene block h-auto w-full',
        isResting && 'is-resting',
        !animate && 'is-static',
      )}
    >
      <defs>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.wall[0]} />
          <stop offset="1" stopColor={theme.wall[1]} />
        </linearGradient>
        <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.floor[0]} />
          <stop offset="1" stopColor={theme.floor[1]} />
        </linearGradient>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.sky[0]} />
          <stop offset="0.55" stopColor={theme.sky[1]} />
          <stop offset="1" stopColor={theme.sky[2]} />
        </linearGradient>
        <linearGradient id={id('desk')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b211b" />
          <stop offset="1" stopColor="#191411" />
        </linearGradient>
        <linearGradient id={id('deskFront')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17141a" />
          <stop offset="1" stopColor="#0f0d11" />
        </linearGradient>
        <radialGradient id={id('horizon')} cx="50%" cy="100%" r="72%">
          <stop offset="0" stopColor={theme.horizonGlow} stopOpacity="0.52" />
          <stop offset="1" stopColor={theme.horizonGlow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('moonGlow')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={theme.moon} stopOpacity="0.22" />
          <stop offset="0.45" stopColor={theme.moon} stopOpacity="0.07" />
          <stop offset="1" stopColor={theme.moon} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('windowWash')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={theme.accent} stopOpacity="0.12" />
          <stop offset="1" stopColor={theme.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('lamp')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={theme.glow} stopOpacity="0.55" />
          <stop offset="0.45" stopColor={theme.glow} stopOpacity="0.18" />
          <stop offset="1" stopColor={theme.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('screen')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={theme.accent} stopOpacity="0.4" />
          <stop offset="1" stopColor={theme.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('led')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.glow} stopOpacity="0.28" />
          <stop offset="1" stopColor={theme.glow} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('pool')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.glow} stopOpacity="0.14" />
          <stop offset="1" stopColor={theme.glow} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('lampCone')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.glow} stopOpacity="0.22" />
          <stop offset="1" stopColor={theme.glow} stopOpacity="0" />
        </linearGradient>
        <clipPath id={id('windowClip')}>
          <rect x="90" y="46" width="260" height="170" rx="3" />
        </clipPath>
        <clipPath id={id('deskClip')}>
          <polygon points="410,222 692,222 708,244 426,244" />
        </clipPath>
      </defs>

      {/* Room shell */}
      <rect width="720" height="300" fill={`url(#${id('wall')})`} />
      <rect y="238" width="720" height="62" fill={`url(#${id('floor')})`} />
      <ellipse
        cx="220"
        cy="248"
        rx="330"
        ry="140"
        fill={`url(#${id('windowWash')})`}
      />
      <g stroke="#ffffff" strokeOpacity="0.035">
        <path d="M392 0V238" />
        <path d="M402 0V238" />
        <path d="M0 68H720" strokeOpacity="0.018" />
      </g>
      <path d="M0 236H720" stroke="#ffffff" strokeOpacity="0.07" />
      <rect y="232" width="720" height="6" fill="#0a0e15" opacity="0.6" />

      {/* Panoramic window */}
      <g>
        <rect
          x="78"
          y="32"
          width="284"
          height="194"
          rx="8"
          fill="#070a10"
          stroke="#ffffff"
          strokeOpacity="0.09"
        />
        <rect
          x="90"
          y="46"
          width="260"
          height="170"
          rx="3"
          fill={`url(#${id('sky')})`}
        />

        <g clipPath={`url(#${id('windowClip')})`}>
          <ellipse
            cx="220"
            cy="204"
            rx="168"
            ry="52"
            fill={`url(#${id('horizon')})`}
            className="studio-glow"
          />

          {theme.weather === 'stars' && (
            <g fill={theme.moon}>
              {STARS.map((star, index) => (
                <circle
                  key={index}
                  cx={star.x}
                  cy={star.y}
                  r={star.r}
                  opacity={star.opacity}
                  className="studio-twinkle"
                  style={{
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`,
                  }}
                />
              ))}
            </g>
          )}

          {theme.weather === 'rain' && (
            <g stroke={theme.accent} strokeLinecap="round">
              {RAIN.map((drop, index) => (
                <line
                  key={index}
                  x1={drop.x}
                  y1={drop.y}
                  x2={drop.x - 1.5}
                  y2={drop.y + drop.length}
                  strokeWidth="0.9"
                  strokeOpacity={drop.opacity}
                  className="studio-rain"
                  style={{
                    animationDelay: `${drop.delay}s`,
                    animationDuration: `${drop.duration}s`,
                  }}
                />
              ))}
            </g>
          )}

          {theme.weather === 'snow' && (
            <g fill="#e2e8f0">
              {SNOW.map((flake, index) => (
                <circle
                  key={index}
                  cx={flake.x}
                  cy={flake.y}
                  r={flake.r}
                  opacity={flake.opacity}
                  className="studio-snow"
                  style={{
                    animationDelay: `${flake.delay}s`,
                    animationDuration: `${flake.duration}s`,
                  }}
                />
              ))}
            </g>
          )}

          <circle cx="314" cy="76" r="24" fill={`url(#${id('moonGlow')})`} />
          <circle cx="314" cy="76" r="7" fill={theme.moon} opacity="0.85" />

          {theme.skyline === 'mountains' ? (
            <g>
              <path
                d="M90 216L112 188L128 202L150 166L174 198L198 174L222 204L246 184L270 168L296 202L318 180L338 198L350 190V216Z"
                fill={theme.silhouette}
              />
              <path
                d="M150 166L158 180L150 178L142 184Z"
                fill="#e2e8f0"
                opacity="0.35"
              />
              <path
                d="M270 168L278 182L270 180L262 186Z"
                fill="#e2e8f0"
                opacity="0.28"
              />
              <path
                d="M90 216L110 200L132 208L156 192L182 210L208 196L232 212L258 198L282 210L306 194L330 208L350 200V216Z"
                fill={theme.silhouette}
                opacity="0.65"
              />
            </g>
          ) : (
            <g>
              <g fill={theme.silhouette}>
                {CITY_BUILDINGS.map((building, index) => (
                  <rect
                    key={index}
                    x={building.x}
                    y={building.y}
                    width={building.w}
                    height={building.h}
                    rx="1"
                  />
                ))}
              </g>
              <g fill={theme.glow} opacity="0.75">
                {CITY_BUILDINGS.map((building, index) => (
                  <g key={index}>
                    <rect
                      x={building.x + 3}
                      y={building.y + 6}
                      width="1.6"
                      height="1.6"
                    />
                    <rect
                      x={building.x + 7}
                      y={building.y + 13}
                      width="1.6"
                      height="1.6"
                      opacity="0.7"
                    />
                    {building.w > 14 && (
                      <rect
                        x={building.x + 10}
                        y={building.y + 21}
                        width="1.6"
                        height="1.6"
                        opacity="0.5"
                      />
                    )}
                  </g>
                ))}
              </g>
              {theme.skyline === 'neon' && (
                <g>
                  <rect
                    x="120"
                    y="168"
                    width="30"
                    height="4"
                    fill={theme.glow}
                    opacity="0.8"
                  />
                  <rect
                    x="232"
                    y="158"
                    width="4"
                    height="22"
                    fill={theme.accent}
                    opacity="0.8"
                  />
                  <circle
                    cx="300"
                    cy="180"
                    r="3"
                    fill={theme.glow}
                    className="studio-glow"
                  />
                </g>
              )}
            </g>
          )}
        </g>

        <rect
          x="90"
          y="46"
          width="260"
          height="170"
          rx="3"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.06"
        />
        <rect x="177" y="46" width="2" height="170" fill="#080b12" opacity="0.9" />
        <rect x="263" y="46" width="2" height="170" fill="#080b12" opacity="0.9" />
        <path
          d="M100 210L250 58"
          stroke="#ffffff"
          strokeOpacity="0.028"
          strokeWidth="2"
        />
        <rect
          x="78"
          y="218"
          width="284"
          height="8"
          rx="3"
          fill="#0b0f16"
          stroke="#ffffff"
          strokeOpacity="0.08"
        />
      </g>

      {/* Wall shelf, LED strip, and art */}
      <g>
        <rect
          x="424"
          y="104"
          width="268"
          height="5"
          rx="2"
          fill="#141b26"
          stroke="#ffffff"
          strokeOpacity="0.07"
        />
        <path d="M444 109V120M672 109V120" stroke="#ffffff" strokeOpacity="0.06" />
        <g style={reveal(2)}>
          <rect x="432" y="109" width="252" height="2" rx="1" fill={theme.glow} opacity="0.85" />
          <rect
            x="432"
            y="109"
            width="252"
            height="16"
            fill={`url(#${id('led')})`}
            className="studio-glow"
          />
        </g>
        <g style={reveal(2)}>
          <rect x="444" y="88" width="6" height="16" fill="#f59e0b" />
          <rect x="451" y="84" width="5" height="20" fill="#34d399" />
          <rect x="457" y="90" width="7" height="14" fill="#60a5fa" />
        </g>
        <g style={reveal(3)}>
          <rect x="520" y="86" width="6" height="18" fill="#a78bfa" />
          <rect x="527" y="90" width="5" height="14" fill="#f472b6" />
          <rect x="533" y="84" width="6" height="20" fill="#2dd4bf" />
          <path d="M646 104V94" stroke="#64748b" />
          <path d="M640 94Q646 86 652 94Q646 100 640 94Z" fill="#34d399" />
          <path d="M646 104H654L653 100H647Z" fill="#334155" />
        </g>
        <g style={reveal(4)}>
          <rect
            x="596"
            y="82"
            width="38"
            height="22"
            rx="3"
            fill="#111827"
            stroke="#334155"
          />
          <circle
            cx="608"
            cy="93"
            r="6"
            fill="#0b0f16"
            stroke={theme.accent}
            strokeOpacity="0.5"
          />
          <circle
            cx="608"
            cy="93"
            r="2"
            fill={theme.accent}
            opacity="0.8"
            className="studio-glow"
          />
          <circle
            cx="624"
            cy="93"
            r="4"
            fill="#0b0f16"
            stroke={theme.glow}
            strokeOpacity="0.4"
          />
        </g>
        <g>
          <rect
            x="646"
            y="52"
            width="42"
            height="34"
            rx="3"
            fill="#0c1119"
            stroke="#ffffff"
            strokeOpacity="0.09"
          />
          <path
            d="M654 78L664 64L672 72L680 58"
            fill="none"
            stroke={theme.accent}
            strokeOpacity="0.6"
            strokeWidth="1.2"
          />
          <circle cx="680" cy="60" r="2" fill={theme.glow} opacity="0.8" />
        </g>
      </g>

      {/* Tall bookshelf */}
      <g>
        <rect
          x="14"
          y="76"
          width="58"
          height="162"
          rx="4"
          fill="#080b11"
          stroke="#ffffff"
          strokeOpacity="0.08"
        />
        <path
          d="M18 112H68M18 150H68M18 188H68"
          stroke="#ffffff"
          strokeOpacity="0.08"
        />
        <path d="M18 80V236M68 80V236" stroke="#ffffff" strokeOpacity="0.04" />
        <g style={reveal(2)}>
          {SHELF_BOOKS.slice(0, 5).map((book, index) => (
            <rect
              key={index}
              x={book.x}
              y={book.y}
              width={book.w}
              height={book.h}
              rx="0.8"
              fill={book.color}
              opacity="0.82"
            />
          ))}
        </g>
        <g style={reveal(3)}>
          {SHELF_BOOKS.slice(5).map((book, index) => (
            <rect
              key={index}
              x={book.x}
              y={book.y}
              width={book.w}
              height={book.h}
              rx="0.8"
              fill={book.color}
              opacity="0.78"
            />
          ))}
        </g>
      </g>

      {/* Loft mezzanine and string lights */}
      <g style={reveal(4)}>
        <path d="M372 22H720" stroke="#263244" strokeWidth="5" />
        <path d="M372 22H720" stroke="#ffffff" strokeOpacity="0.08" />
        <path d="M372 40H720" stroke="#1e293b" strokeWidth="2" />
        {Array.from({ length: 15 }, (_, index) => (
          <path
            key={index}
            d={`M${382 + index * 23} 24V40`}
            stroke="#1e293b"
            strokeWidth="2"
          />
        ))}
        <g className="studio-string">
          <path
            d="M14 18Q180 46 360 24T706 16"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
          />
          {STRING_BULBS.map((bulb, index) => (
            <g key={index}>
              <circle cx={bulb.x} cy={bulb.y} r="4" fill={theme.glow} opacity="0.14" />
              <circle
                cx={bulb.x}
                cy={bulb.y}
                r="1.6"
                fill="#fef3c7"
                className="studio-glow"
                style={{ animationDelay: `${index * 0.28}s` }}
              />
            </g>
          ))}
        </g>
      </g>

      {/* Floor perspective and window light */}
      <g stroke="#ffffff" strokeOpacity="0.03">
        <path d="M0 260H720" />
        <path d="M0 280H720" />
        <path d="M360 238L120 300" />
        <path d="M360 238L600 300" />
      </g>
      <path d="M90 220H350L430 300H18Z" fill={`url(#${id('pool')})`} opacity="0.5" />

      {/* Monstera by the window */}
      <g style={reveal(3)}>
        <ellipse cx="376" cy="238" rx="20" ry="4" fill="#000000" opacity="0.3" />
        <path
          d="M363 216H389L385 236H367Z"
          fill="#334155"
          stroke="#475569"
          strokeWidth="1"
        />
        <path d="M363 216H389" stroke="#64748b" />
        <g stroke="#2f8f6b" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M376 216Q372 198 360 188" />
          <path d="M376 216Q380 196 392 186" />
          <path d="M376 216Q376 196 374 178" />
        </g>
        <path d="M360 188Q344 184 344 168Q362 166 368 182Z" fill="#2f8f6b" />
        <path d="M392 186Q408 182 408 166Q390 164 384 180Z" fill="#34d399" />
        <path d="M374 178Q356 170 360 154Q378 158 382 174Z" fill="#1f6f54" />
        <path d="M374 178Q392 170 388 154Q370 158 366 174Z" fill="#2dd4bf" opacity="0.8" />
      </g>

      {/* Rug */}
      <g style={reveal(4)}>
        <ellipse
          cx="330"
          cy="288"
          rx="54"
          ry="11"
          fill="#1f2937"
          stroke="#334155"
          strokeOpacity="0.7"
        />
        <ellipse cx="330" cy="288" rx="40" ry="7.5" fill="#273449" opacity="0.65" />
      </g>

      {/* Desk */}
      <ellipse cx="560" cy="292" rx="168" ry="12" fill="#000000" opacity="0.35" />
      <g>
        <polygon
          points="410,222 692,222 708,244 426,244"
          fill={`url(#${id('desk')})`}
          stroke="#ffffff"
          strokeOpacity="0.08"
        />
        <polygon
          points="426,244 708,244 708,286 426,286"
          fill={`url(#${id('deskFront')})`}
          stroke="#ffffff"
          strokeOpacity="0.05"
        />
        <path d="M410 222H692" stroke={theme.glow} strokeOpacity="0.18" strokeWidth="1.2" />
        <path d="M438 258H696" stroke="#ffffff" strokeOpacity="0.035" />
        <path d="M438 274H696" stroke="#ffffff" strokeOpacity="0.03" />
        <path d="M446 250H456M680 250H690" stroke="#ffffff" strokeOpacity="0.2" />
        <rect x="436" y="286" width="12" height="14" rx="2" fill="#0d0b0e" />
        <rect x="692" y="286" width="12" height="14" rx="2" fill="#0d0b0e" />
      </g>

      {/* Blueprint foundation */}
      <g style={blueprintReveal}>
        <g
          clipPath={`url(#${id('deskClip')})`}
          stroke={theme.accent}
          strokeOpacity="0.25"
          strokeWidth="0.7"
        >
          {Array.from({ length: 15 }, (_, index) => (
            <path key={`v${index}`} d={`M${410 + index * 20} 222V244`} />
          ))}
          {Array.from({ length: 3 }, (_, index) => (
            <path key={`h${index}`} d={`M410 ${226 + index * 7}H708`} />
          ))}
        </g>
        <rect
          x="498"
          y="136"
          width="106"
          height="74"
          rx="5"
          fill="none"
          stroke={theme.accent}
          strokeOpacity="0.32"
          strokeDasharray="4 5"
        />
        <circle
          cx="620"
          cy="208"
          r="10"
          fill="none"
          stroke={theme.accent}
          strokeOpacity="0.28"
          strokeDasharray="3 4"
        />
        <path d="M410 222H708" stroke={theme.accent} strokeOpacity="0.35" strokeWidth="1" />
        <g stroke={theme.accent} strokeOpacity="0.2">
          <path d="M420 244L330 300" />
          <path d="M520 244L500 300" />
          <path d="M620 244L690 300" />
        </g>
      </g>

      {/* Architect lamp */}
      <g style={reveal(1)}>
        <ellipse
          cx="620"
          cy="208"
          rx="86"
          ry="40"
          fill={`url(#${id('lamp')})`}
          className="studio-lamp"
        />
        <path
          d="M612 182H642L688 224H574Z"
          fill={`url(#${id('lampCone')})`}
          opacity="0.5"
        />
        <ellipse
          cx="664"
          cy="223"
          rx="16"
          ry="4"
          fill="#0b0f16"
          stroke="#ffffff"
          strokeOpacity="0.08"
        />
        <path
          d="M664 221V182Q664 166 646 166"
          fill="none"
          stroke="#3f4a5a"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M646 166L622 174"
          stroke="#3f4a5a"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M610 168H644L636 182H618Z"
          fill="#b45309"
          stroke="#f59e0b"
          strokeOpacity="0.4"
        />
        <circle cx="627" cy="183" r="3.5" fill="#fef3c7" />
      </g>

      {/* Second monitor */}
      <g style={reveal(4)}>
        <ellipse
          cx="462"
          cy="184"
          rx="60"
          ry="42"
          fill={`url(#${id('screen')})`}
          opacity="0.5"
        />
        <rect x="460" y="212" width="7" height="10" fill="#1e293b" />
        <rect
          x="436"
          y="154"
          width="56"
          height="58"
          rx="5"
          fill="#0a0e15"
          stroke="#334155"
        />
        <rect x="441" y="159" width="46" height="48" rx="2" fill="#07131a" />
        <g
          style={{
            opacity: isResting ? 0.2 : 1,
            transition: 'opacity 700ms ease',
          }}
        >
          <rect x="446" y="166" width="16" height="2" rx="1" fill={theme.accent} opacity="0.8" />
          <rect x="446" y="171" width="30" height="2" rx="1" fill="#94a3b8" opacity="0.5" />
          <rect x="446" y="176" width="22" height="2" rx="1" fill={theme.glow} opacity="0.55" />
          <rect x="446" y="181" width="34" height="2" rx="1" fill="#94a3b8" opacity="0.35" />
        </g>
      </g>

      {/* Primary monitor */}
      <g style={reveal(1)}>
        <ellipse
          cx="552"
          cy="176"
          rx="110"
          ry="64"
          fill={`url(#${id('screen')})`}
          className="studio-glow"
        />
        <rect x="548" y="208" width="8" height="12" fill="#1e293b" />
        <ellipse
          cx="552"
          cy="221"
          rx="24"
          ry="4"
          fill="#0b0f16"
          stroke="#ffffff"
          strokeOpacity="0.08"
        />
        <rect
          x="498"
          y="136"
          width="106"
          height="74"
          rx="6"
          fill="#0a0e15"
          stroke="#334155"
          strokeWidth="1.2"
        />
        <rect x="504" y="142" width="94" height="62" rx="3" fill="#07131a" />

        <g
          style={{
            opacity: isResting ? 0 : 1,
            transition: 'opacity 700ms ease',
          }}
        >
          <rect
            x="511"
            y="150"
            width="28"
            height="2.4"
            rx="1.2"
            fill={theme.accent}
            opacity="0.85"
            className="studio-code"
          />
          <rect
            x="511"
            y="156"
            width="48"
            height="2.4"
            rx="1.2"
            fill="#94a3b8"
            opacity="0.55"
            className="studio-code"
            style={{ animationDelay: '0.4s' }}
          />
          <rect
            x="511"
            y="162"
            width="36"
            height="2.4"
            rx="1.2"
            fill={theme.glow}
            opacity="0.65"
            className="studio-code"
            style={{ animationDelay: '0.8s' }}
          />
          <rect
            x="511"
            y="168"
            width="56"
            height="2.4"
            rx="1.2"
            fill="#94a3b8"
            opacity="0.4"
            className="studio-code"
            style={{ animationDelay: '1.2s' }}
          />
          <rect
            x="511"
            y="174"
            width="22"
            height="2.4"
            rx="1.2"
            fill={theme.accent}
            opacity="0.55"
            className="studio-code"
            style={{ animationDelay: '1.6s' }}
          />
          <path
            d="M512 194Q520 190 528 194T544 194T560 194T576 194T592 194"
            fill="none"
            stroke={theme.accent}
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />
        </g>

        <g
          style={{
            opacity: isResting ? 1 : 0,
            transition: 'opacity 700ms ease',
          }}
        >
          <rect x="504" y="142" width="94" height="62" rx="3" fill="#07131a" />
          <path
            d="M512 178Q530 164 548 176T590 172"
            fill="none"
            stroke={theme.accent}
            strokeOpacity="0.5"
            strokeWidth="1.2"
            className="studio-screen-wave"
          />
        </g>
      </g>

      {/* Keyboard and notebook */}
      <g style={reveal(2)}>
        <path
          d="M468 231L552 231L558 241L474 241Z"
          fill="#111827"
          stroke="#334155"
          strokeWidth="1"
        />
        <g stroke="#475569" strokeWidth="0.8" opacity="0.8">
          <path d="M476 234H554" />
          <path d="M474 237H556" />
          <path d="M472 240H558" />
        </g>
      </g>
      <g style={reveal(2)}>
        <rect
          x="424"
          y="231"
          width="34"
          height="13"
          rx="2"
          fill="#1f2937"
          stroke="#334155"
        />
        <rect x="424" y="231" width="34" height="3" rx="1" fill={theme.glow} opacity="0.45" />
        <path d="M430 237H450" stroke="#94a3b8" strokeOpacity="0.5" />
        <path
          d="M458 234L470 232"
          stroke={theme.glow}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Coffee mug */}
      <g style={reveal(2)}>
        <ellipse cx="616" cy="222" rx="13" ry="3" fill="#000000" opacity="0.35" />
        <path d="M607 208H625V220A9 9 0 0 1 607 220Z" fill="#d6d3d1" />
        <ellipse cx="616" cy="208" rx="9" ry="3" fill="#57534e" />
        <path
          d="M625 211H629A5 5 0 0 1 629 221H625"
          fill="none"
          stroke="#d6d3d1"
          strokeWidth="2.4"
        />
        <g
          fill="none"
          stroke="#e7e5e4"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.55"
        >
          <path
            d="M612 203Q609 198 612 193Q615 188 612 183"
            className="studio-steam"
          />
          <path
            d="M617 204Q614 199 617 194Q620 189 617 184"
            className="studio-steam"
            style={{ animationDelay: '0.9s' }}
          />
          <path
            d="M621 203Q618 198 621 193Q624 188 621 183"
            className="studio-steam"
            style={{ animationDelay: '1.8s' }}
          />
        </g>
      </g>

      {/* Sleeping companion */}
      <g style={reveal(4)}>
        <g className="studio-pet">
          <ellipse cx="328" cy="285" rx="20" ry="8.5" fill="#0b0f16" />
          <circle cx="345" cy="282" r="7" fill="#0b0f16" />
          <path d="M340 277L338 271L344 275Z" fill="#0b0f16" />
          <path d="M348 275L352 270L352 277Z" fill="#0b0f16" />
          <path
            d="M310 286Q302 280 308 274"
            fill="none"
            stroke="#0b0f16"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M324 289Q328 292 332 289"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            opacity="0.7"
          />
          <path
            d="M340 283Q345 285 348 283"
            fill="none"
            stroke={theme.glow}
            strokeWidth="1"
            opacity="0.25"
          />
        </g>
      </g>

      {/* Floating dust in the lamplight */}
      <g fill={theme.glow} opacity="0.35">
        {DUST.map((dot, index) => (
          <circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            className="studio-drift"
            style={{
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`,
            }}
          />
        ))}
      </g>
    </svg>
  )
}

export function FocusStudio({
  sessions = [],
  liveFocusMs = 0,
  status = 'idle',
  enabled = true,
  animate = true,
  className,
}) {
  const [themeId, setThemeId] = useState(STUDIO_THEMES[0].id)
  const [lockedTheme, setLockedTheme] = useState(null)
  const [milestonesOpen, setMilestonesOpen] = useState(false)
  const milestonesId = useId()

  if (!enabled) return null

  const studio = getStudioProgress(sessions, liveFocusMs)
  const theme =
    STUDIO_THEMES.find((item) => item.id === themeId) ?? STUDIO_THEMES[0]
  const progressPercent = Math.round(studio.progress * 100)
  const nextLabel = studio.nextStage
    ? `${formatDurationShort(
        studio.minutesToNext * 60_000,
      )} left until “Stage ${studio.nextStage.number}: ${studio.nextStage.name}”`
    : 'Legendary loft unlocked — every stage is yours.'

  const handleThemeSelect = (nextTheme) => {
    setThemeId(nextTheme.id)
    if (nextTheme.locked) setLockedTheme(nextTheme)
  }

  return (
    <section
      aria-label="Your Focus Studio"
      className={cx(
        'overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f12] text-zinc-100 shadow-2xl shadow-black/25',
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            <Building2 className="size-3 text-emerald-400/80" aria-hidden="true" />
            Your Focus Studio
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-white sm:text-xl">
            <span className="text-zinc-500">Stage {studio.stage.number}:</span>{' '}
            {studio.stage.name}
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
            {studio.stage.description}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-[23rem] lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={status} totalFocusMs={studio.totalFocusMs} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold tabular-nums text-zinc-300">
              <Sparkles className="size-3 text-amber-300/80" aria-hidden="true" />
              {formatDurationShort(studio.totalFocusMs)} focused
            </span>
          </div>

          <div className="w-full">
            <div className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="truncate font-semibold text-zinc-300">{nextLabel}</span>
              <span className="shrink-0 tabular-nums text-zinc-500">
                {progressPercent}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMilestonesOpen((open) => !open)}
              aria-expanded={milestonesOpen}
              aria-controls={milestonesId}
              aria-label="Show studio milestones"
              className="mt-2 block w-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              <span className="relative block h-1.5 overflow-hidden rounded-full bg-white/10">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 transition-[width] duration-700"
                  style={{ width: `${Math.max(3, studio.progress * 100)}%` }}
                />
              </span>
            </button>

            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-500">
                Built by {studio.completedSessions}{' '}
                {studio.completedSessions === 1 ? 'session' : 'sessions'}
              </span>
              <button
                type="button"
                onClick={() => setMilestonesOpen((open) => !open)}
                aria-expanded={milestonesOpen}
                aria-controls={milestonesId}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Milestones
                <ChevronDown
                  className={cx(
                    'size-3 transition-transform',
                    milestonesOpen && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#080b12]">
          <StudioScene
            stageIndex={studio.stageIndex}
            theme={theme}
            status={status}
            animate={animate}
          />
          <ThemeSwitcher activeTheme={theme} onSelect={handleThemeSelect} />
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/70 backdrop-blur-md">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            {theme.name}
            {theme.locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/70">
                <Lock className="size-2.5" aria-hidden="true" />
                Preview
              </span>
            )}
          </div>
        </div>

        <div
          id={milestonesId}
          hidden={!milestonesOpen}
          className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        >
          {STUDIO_STAGES.map((stage, index) => {
            const unlocked = studio.stageIndex >= index
            const current = studio.stageIndex === index
            const next = studio.stageIndex + 1 === index

            return (
              <div
                key={stage.id}
                className={cx(
                  'rounded-xl border px-3 py-2.5',
                  current
                    ? 'border-emerald-400/30 bg-emerald-400/[0.07]'
                    : unlocked
                      ? 'border-white/10 bg-white/[0.03]'
                      : 'border-white/[0.06] bg-white/[0.015]',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cx(
                      'grid size-5 place-items-center rounded-full text-[10px] font-black',
                      unlocked
                        ? 'bg-emerald-400/15 text-emerald-300'
                        : 'bg-white/5 text-zinc-500',
                    )}
                  >
                    {unlocked ? (
                      <Check className="size-3" aria-hidden="true" />
                    ) : (
                      stage.number
                    )}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    {stage.range}
                  </span>
                </div>
                <p
                  className={cx(
                    'mt-2 text-xs font-bold',
                    unlocked ? 'text-white' : 'text-zinc-400',
                  )}
                >
                  {stage.name}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-zinc-500">
                  {stage.description}
                </p>
                <p
                  className={cx(
                    'mt-1.5 text-[9px] font-bold uppercase tracking-[0.12em]',
                    current
                      ? 'text-emerald-300'
                      : next
                        ? 'text-amber-300/80'
                        : 'text-zinc-600',
                  )}
                >
                  {current
                    ? 'You are here'
                    : unlocked
                      ? 'Unlocked'
                      : next
                        ? 'Next unlock'
                        : 'Locked'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        open={Boolean(lockedTheme)}
        onClose={() => setLockedTheme(null)}
        title="LaplyGo Pro — coming soon"
        description="Unlock exclusive environments, ambient soundscapes, and cloud sync with LaplyGo Pro."
        size="md"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setThemeId(STUDIO_THEMES[0].id)
                setLockedTheme(null)
              }}
            >
              Back to Midnight Loft
            </Button>
            <Button onClick={() => setLockedTheme(null)}>Keep previewing</Button>
          </div>
        }
      >
        {lockedTheme && (
          <div className="space-y-4">
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 p-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${lockedTheme.sky[0]}, ${lockedTheme.sky[2]})`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                    Pro preview
                  </p>
                  <p className="mt-1 text-lg font-extrabold tracking-tight">
                    {lockedTheme.name}
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/60">
                    {lockedTheme.blurb}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-bold">
                  <Crown className="size-3" aria-hidden="true" />
                  Pro
                </span>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                Every free studio stays yours, forever.
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                Pro adds new environments and ambient soundscapes.
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                Cloud sync keeps your studio consistent across devices.
              </li>
            </ul>

            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              This is a preview only. Your current focus time and saved sessions
              are unchanged.
            </p>
          </div>
        )}
      </Modal>
    </section>
  )
}
