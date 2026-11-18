import { useRef, useState } from 'react'
import {
  Bell,
  Check,
  Cloud,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Leaf,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TimerReset,
  Trash2,
  Upload,
  UserRound,
  Volume2,
} from 'lucide-react'
import {
  BUILTIN_PRESETS,
  DAILY_GOAL_MAX_HOURS,
  DAILY_GOAL_MIN_HOURS,
  DAILY_GOAL_PRESETS,
  DAILY_GOAL_STEP_HOURS,
  REMINDER_PRESETS,
  STORAGE_KEYS,
  TARGET_SESSION_PRESETS,
} from '../constants.js'
import { ClearHistoryDialog } from '../components/dialogs/ClearHistoryDialog.jsx'
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog.jsx'
import { Button } from '../components/ui/Button.jsx'
import { SegmentedControl } from '../components/ui/SegmentedControl.jsx'
import { Switch } from '../components/ui/Switch.jsx'
import { useToast } from '../hooks/useToast.js'
import {
  exportBackup,
  exportSessionsAsCSV,
  exportSessionsAsJSON,
  parseBackupFile,
} from '../utils/exportData.js'
import {
  canUseNotifications,
  requestNotificationPermission,
} from '../utils/feedback.js'
import { formatBytes, getStorageBytes } from '../utils/storage.js'
import { formatGoal } from '../utils/timeFormatters.js'
import { cx } from '../utils/cx.js'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
  emerald:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
  zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
}

function SettingsSection({ icon: Icon, title, description, tone = 'indigo', children }) {
  return (
    <section className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl', TONES[tone])}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function SettingRow({ label, description, children, className }) {
  return (
    <div
      className={cx(
        'flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function ChoiceButton({ active, children, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'min-h-10 rounded-xl border px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        active
          ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-zinc-950'
          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function SettingsView({
  settings,
  updateSettings,
  sessions,
  customPresets,
  onCreateActivity,
  onEditActivity,
  onDeletePreset,
  onImportBackup,
  onClearHistory,
  user,
  onOpenAuth,
  cloud,
}) {
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [pendingBackup, setPendingBackup] = useState(null)
  const [requestingNotifications, setRequestingNotifications] = useState(false)
  const importInputRef = useRef(null)
  const { notify } = useToast()
  const storageBytes = getStorageBytes([
    STORAGE_KEYS.sessions,
    STORAGE_KEYS.settings,
    STORAGE_KEYS.presets,
    STORAGE_KEYS.countdown,
    STORAGE_KEYS.timer,
  ])

  const handleBackup = () => {
    exportBackup({ sessions, settings, presets: customPresets, user })
    notify('Full backup exported as JSON.', 'success')
  }

  const handleCSV = () => {
    if (!sessions.length) return
    exportSessionsAsCSV(sessions)
    notify('History exported as CSV.', 'success')
  }

  const handleJSON = () => {
    if (!sessions.length) return
    exportSessionsAsJSON(sessions)
    notify('History exported as JSON.', 'success')
  }

  const handleClear = () => {
    setShowClearDialog(false)
    onClearHistory()
  }

  const handleSync = async () => {
    const result = await cloud.syncNow()
    if (result.ok) notify('Cloud sync complete.', 'success')
    else notify('Sync failed. Local data is still safe.', 'error')
  }

  const handleNotifications = async (next) => {
    if (!next) {
      updateSettings({ notificationsEnabled: false })
      return
    }
    if (!canUseNotifications()) {
      notify('This browser does not support notifications.', 'info')
      return
    }

    setRequestingNotifications(true)
    const permission = await requestNotificationPermission()
    setRequestingNotifications(false)

    if (permission === 'granted') {
      updateSettings({ notificationsEnabled: true })
      notify('Completion and reminder notifications enabled.', 'success')
    } else {
      updateSettings({ notificationsEnabled: false })
      notify('Notifications were blocked by the browser.', 'info')
    }
  }

  const handleFilePicked = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const parsed = await parseBackupFile(file)
      setPendingBackup(parsed)
    } catch (error) {
      notify(error.message || 'Could not read that backup.', 'error')
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl lg:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Tune the experience, your activities, and how your data is kept.
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/70 shadow-sm shadow-zinc-950/[0.02] backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:shadow-black/10">
        <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
          {/* A. Focus goals */}
          <SettingsSection
            icon={Target}
            title="Focus goals"
            description="A gentle target, not a rule. You can change it at any time."
          >
            <div className="rounded-2xl bg-zinc-50/80 p-4 dark:bg-zinc-950/30">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor="daily-goal" className="text-sm font-semibold">
                  Daily focus target
                </label>
                <output
                  htmlFor="daily-goal"
                  className="text-xl font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300"
                >
                  {formatGoal(settings.dailyGoalHours)}
                </output>
              </div>
              <input
                id="daily-goal"
                type="range"
                min={DAILY_GOAL_MIN_HOURS}
                max={DAILY_GOAL_MAX_HOURS}
                step={DAILY_GOAL_STEP_HOURS}
                value={settings.dailyGoalHours}
                onChange={(event) =>
                  updateSettings({ dailyGoalHours: Number(event.target.value) })
                }
                aria-valuetext={`${settings.dailyGoalHours} hours`}
                className="mt-3 w-full cursor-pointer accent-indigo-600"
              />
              <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{DAILY_GOAL_MIN_HOURS}h</span>
                <span>{DAILY_GOAL_MAX_HOURS}h</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {DAILY_GOAL_PRESETS.map((hours) => (
                  <ChoiceButton
                    key={hours}
                    active={settings.dailyGoalHours === hours}
                    onClick={() => updateSettings({ dailyGoalHours: hours })}
                  >
                    {hours}h
                  </ChoiceButton>
                ))}
              </div>
            </div>

            <div className="mt-5 divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
              <SettingRow
                label="Target session length"
                description="Prefills the countdown timer for new sessions."
              >
                <div className="flex flex-wrap gap-2">
                  {TARGET_SESSION_PRESETS.map((minutes) => (
                    <ChoiceButton
                      key={minutes}
                      active={settings.targetSessionMinutes === minutes}
                      onClick={() =>
                        updateSettings({ targetSessionMinutes: minutes })
                      }
                    >
                      {minutes}m
                    </ChoiceButton>
                  ))}
                </div>
              </SettingRow>

              <SettingRow
                label="Optional reminders"
                description="A low-key check-in while a focus session is running. Requires notifications."
              >
                <Switch
                  checked={settings.remindersEnabled}
                  onChange={(value) =>
                    updateSettings({ remindersEnabled: value })
                  }
                  label="Enable focus reminders"
                />
              </SettingRow>

              {settings.remindersEnabled && (
                <SettingRow label="Remind me every">
                  <div className="flex flex-wrap gap-2">
                    {REMINDER_PRESETS.map((minutes) => (
                      <ChoiceButton
                        key={minutes}
                        active={settings.reminderMinutes === minutes}
                        onClick={() =>
                          updateSettings({ reminderMinutes: minutes })
                        }
                      >
                        {minutes}m
                      </ChoiceButton>
                    ))}
                  </div>
                </SettingRow>
              )}
            </div>
          </SettingsSection>

          {/* B. Appearance */}
          <SettingsSection
            icon={Palette}
            title="Appearance"
            description="LaplyGo is designed to feel calm in both light and dark rooms."
            tone="violet"
          >
            <SegmentedControl
              label="Theme"
              options={THEME_OPTIONS}
              value={settings.theme}
              onChange={(value) => updateSettings({ theme: value })}
              hideIconsOnMobile
            />
          </SettingsSection>

          {/* C. Focus experience */}
          <SettingsSection
            icon={Sparkles}
            title="Focus experience"
            description="Choose the feedback that helps you stay present."
            tone="emerald"
          >
            <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
              <SettingRow
                label="Completion sound"
                description="A soft chime when a countdown reaches zero."
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <Volume2 className="size-4" aria-hidden="true" />
                  <Switch
                    checked={settings.soundEnabled}
                    onChange={(value) => updateSettings({ soundEnabled: value })}
                    label="Enable completion sound"
                  />
                </span>
              </SettingRow>

              <SettingRow
                label="Browser notifications"
                description="Used for countdown completion and optional reminders."
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <Bell className="size-4" aria-hidden="true" />
                  <Switch
                    checked={settings.notificationsEnabled}
                    onChange={handleNotifications}
                    disabled={requestingNotifications || !canUseNotifications()}
                    label="Enable browser notifications"
                  />
                </span>
              </SettingRow>

              <SettingRow
                label="Animations"
                description="Subtle motion in the focus world and interface."
              >
                <Switch
                  checked={settings.animationsEnabled}
                  onChange={(value) =>
                    updateSettings({ animationsEnabled: value })
                  }
                  label="Enable animations"
                />
              </SettingRow>

              <SettingRow
                label="Your Focus World"
                description="A peaceful visual garden that grows with focus time. Nothing wilts when you rest."
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <Leaf className="size-4 text-emerald-500" aria-hidden="true" />
                  <Switch
                    checked={settings.focusWorldEnabled}
                    onChange={(value) =>
                      updateSettings({ focusWorldEnabled: value })
                    }
                    label="Show your Focus World"
                  />
                </span>
              </SettingRow>

              <SettingRow
                label="Reduce motion"
                description="Disables looping animations even if animations are on."
              >
                <Switch
                  checked={settings.reducedMotion}
                  onChange={(value) => updateSettings({ reducedMotion: value })}
                  label="Reduce motion"
                />
              </SettingRow>
            </div>
          </SettingsSection>

          {/* D. Activities */}
          <SettingsSection
            icon={TimerReset}
            title="Activities"
            description="Tag sessions with what you are actually doing. Defaults stay available forever."
            tone="amber"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
              Default activities
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {BUILTIN_PRESETS.map((preset) => (
                <li
                  key={preset.id}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-300"
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span aria-hidden="true">{preset.emoji}</span>
                  {preset.label}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                Custom activities
              </p>
              <Button size="sm" variant="secondary" onClick={onCreateActivity}>
                <Plus className="size-4" aria-hidden="true" />
                New activity
              </Button>
            </div>

            {customPresets.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-zinc-300 px-3.5 py-3 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Add an activity for a class, instrument, side project, or anything
                that deserves its own label.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
                {customPresets.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl text-base"
                      style={{ backgroundColor: `${item.color}18` }}
                    >
                      <span aria-hidden="true">{item.emoji}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {item.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <button
                      type="button"
                      onClick={() => onEditActivity(item)}
                      aria-label={`Edit ${item.label}`}
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePreset(item.id)}
                      aria-label={`Delete ${item.label} activity`}
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SettingsSection>

          {/* E. Data & privacy */}
          <SettingsSection
            icon={Database}
            title="Data & privacy"
            description="Everything lives in this browser until you choose to export it."
            tone="zinc"
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Records', value: sessions.length },
                { label: 'Custom', value: customPresets.length },
                { label: 'Local', value: formatBytes(storageBytes) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950/30"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleBackup}>
                <Download className="size-4" aria-hidden="true" />
                Full backup
              </Button>
              <Button variant="secondary" onClick={handleCSV} disabled={!sessions.length}>
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                CSV history
              </Button>
              <Button variant="secondary" onClick={handleJSON} disabled={!sessions.length}>
                <FileJson className="size-4" aria-hidden="true" />
                JSON
              </Button>
              <Button
                variant="secondary"
                onClick={() => importInputRef.current?.click()}
              >
                <Upload className="size-4" aria-hidden="true" />
                Import backup
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFilePicked}
                className="sr-only"
                aria-label="Choose a LaplyGo backup file"
              />
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-3.5 py-3 text-xs leading-relaxed text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07] dark:text-emerald-200">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>
                No API keys, analytics scripts, or third-party tracking are bundled.
                Imports are sanitized before merging with local data.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 dark:border-rose-500/25 dark:bg-rose-500/[0.07]">
              <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Clear history
              </p>
              <p className="mt-0.5 text-xs text-rose-800/70 dark:text-rose-200/60">
                Activities, goals, and settings are not affected.
              </p>
              <Button
                variant="danger"
                size="sm"
                className="mt-3"
                onClick={() => setShowClearDialog(true)}
                disabled={!sessions.length}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Clear {sessions.length} record{sessions.length === 1 ? '' : 's'}
              </Button>
            </div>
          </SettingsSection>

          {/* F. Account & sync */}
          <SettingsSection
            icon={Cloud}
            title="Account & sync"
            description="Local-first by default. Sign in to keep a preview account and sync history."
            tone={user ? 'emerald' : 'indigo'}
          >
            {user ? (
              <div>
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/30">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white dark:bg-indigo-500 dark:text-zinc-950">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {user.email}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span
                      aria-hidden="true"
                      className={cx(
                        'size-1.5 rounded-full bg-emerald-500',
                        cloud.syncing && 'animate-pulse',
                      )}
                    />
                    {cloud.syncing ? 'Syncing' : 'Synced'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={onOpenAuth}>
                    <UserRound className="size-4" aria-hidden="true" />
                    Manage account
                  </Button>
                  <Button variant="secondary" onClick={handleSync} disabled={cloud.syncing}>
                    <Cloud className="size-4" aria-hidden="true" />
                    {cloud.syncing ? 'Syncing…' : 'Sync now'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/30">
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Local only
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Your timer and history work fully offline.
                  </p>
                </div>
                <Button size="sm" onClick={onOpenAuth}>
                  <Cloud className="size-4" aria-hidden="true" />
                  Sign in
                </Button>
              </div>
            )}
          </SettingsSection>
        </div>
      </div>

      <ClearHistoryDialog
        open={showClearDialog}
        sessionCount={sessions.length}
        onConfirm={handleClear}
        onCancel={() => setShowClearDialog(false)}
      />

      <ConfirmDialog
        open={Boolean(pendingBackup)}
        title="Merge this backup?"
        description="Sessions and activities are merged by id. Imported settings replace matching preferences."
        confirmLabel="Merge backup"
        cancelLabel="Cancel"
        tone="primary"
        onConfirm={() => {
          onImportBackup(pendingBackup)
          setPendingBackup(null)
        }}
        onCancel={() => setPendingBackup(null)}
      >
        {pendingBackup && (
          <div className="space-y-2 rounded-xl bg-zinc-50 px-3.5 py-3 text-sm dark:bg-zinc-800/60">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500 dark:text-zinc-400">Sessions</span>
              <span className="font-bold tabular-nums">{pendingBackup.sessions.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500 dark:text-zinc-400">Custom activities</span>
              <span className="font-bold tabular-nums">{pendingBackup.presets.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500 dark:text-zinc-400">Settings included</span>
              <span className="inline-flex items-center gap-1 font-bold">
                {pendingBackup.settings ? (
                  <>
                    <Check className="size-4 text-emerald-500" aria-hidden="true" />
                    Yes
                  </>
                ) : (
                  'No'
                )}
              </span>
            </div>
            {pendingBackup.exportedAt && (
              <p className="border-t border-zinc-200 pt-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Exported {new Date(pendingBackup.exportedAt).toLocaleDateString()} ·{' '}
                {formatBytes(JSON.stringify(pendingBackup).length)}
              </p>
            )}
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
