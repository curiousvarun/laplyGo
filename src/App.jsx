import { Analytics } from '@vercel/analytics/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BREAK_PRESET,
  COUNTDOWN_BREAK_MINUTES,
  DEFAULT_PRESET_ID,
  STORAGE_KEYS,
} from './constants.js'
import { AppShell } from './components/layout/AppShell.jsx'
import { TopBar } from './components/layout/TopBar.jsx'
import { Modal } from './components/ui/Modal.jsx'
import { Button } from './components/ui/Button.jsx'
import { AuthDialog } from './components/auth/AuthDialog.jsx'
import { ShareSessionDialog } from './components/share/ShareSessionDialog.jsx'
import { CustomPresetDialog } from './components/presets/CustomPresetDialog.jsx'
import { SessionSummaryModal } from './components/timer/SessionSummaryModal.jsx'
import { useStopwatch } from './hooks/useStopwatch.js'
import { useCountdown } from './hooks/useCountdown.js'
import { useSettings } from './hooks/useSettings.js'
import { usePresets } from './hooks/usePresets.js'
import { useSessions } from './hooks/useSessions.js'
import { useAuth } from './hooks/useAuth.js'
import { useCloudSync } from './hooks/useCloudSync.js'
import { useTheme } from './hooks/useTheme.js'
import { useWakeLock } from './hooks/useWakeLock.js'
import { useDocumentTitle } from './hooks/useDocumentTitle.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useZenMode } from './hooks/useZenMode.js'
import { useToast } from './hooks/useToast.js'
import { useMotionPreferences } from './hooks/useMotionPreferences.js'
import { useFocusReminders } from './hooks/useFocusReminders.js'
import { StopwatchView } from './views/StopwatchView.jsx'
import { CountdownView } from './views/CountdownView.jsx'
import { HistoryView } from './views/HistoryView.jsx'
import { AnalyticsView } from './views/AnalyticsView.jsx'
import { SettingsView } from './views/SettingsView.jsx'
import { getPresetById } from './utils/presets.js'
import { clearCloudHistory } from './utils/cloudSync.js'
import {
  formatClock,
  formatPreciseClock,
} from './utils/timeFormatters.js'
import { readStorage } from './utils/storage.js'
import {
  playCompletionChime,
  showBrowserNotification,
} from './utils/feedback.js'

function getInitialPresetId() {
  const saved = readStorage(STORAGE_KEYS.timer, null)
  return typeof saved?.presetId === 'string' && saved.presetId
    ? saved.presetId
    : DEFAULT_PRESET_ID
}

function getInitialCountdownPresetId() {
  const saved = readStorage(STORAGE_KEYS.countdown, null)
  if (saved?.presetId === 'break') return 'break'
  return typeof saved?.presetId === 'string' && saved.presetId
    ? saved.presetId
    : DEFAULT_PRESET_ID
}

export default function App() {
  const [view, setView] = useState('stopwatch')
  const [resetTarget, setResetTarget] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [presetDialog, setPresetDialog] = useState(null)
  const [shareSession, setShareSession] = useState(null)
  const [completedSession, setCompletedSession] = useState(null)
  const handledCountdownRef = useRef(null)
  const { notify } = useToast()

  const { settings, updateSettings } = useSettings()
  const { isDark } = useTheme(settings.theme)
  useMotionPreferences(settings)

  const {
    sessions,
    addSessions,
    deleteSession,
    clearSessions,
    mergeSessions,
  } = useSessions()
  const {
    presets,
    customPresets,
    addPreset,
    editPreset,
    deletePreset,
    mergePresets,
  } = usePresets()

  const [activePresetId, setActivePresetId] = useState(
    () => getPresetById(getInitialPresetId(), customPresets).id,
  )
  const [countdownPresetId, setCountdownPresetId] = useState(
    () => getInitialCountdownPresetId(),
  )

  const activePreset = useMemo(
    () => getPresetById(activePresetId, customPresets),
    [activePresetId, customPresets],
  )
  const countdownPreset = useMemo(
    () =>
      countdownPresetId === 'break'
        ? BREAK_PRESET
        : getPresetById(countdownPresetId, customPresets),
    [countdownPresetId, customPresets],
  )

  const timer = useStopwatch({
    initialPresetId: activePresetId,
    preset: activePreset,
  })
  const countdown = useCountdown({
    initialPresetId: countdownPresetId,
    preset: countdownPreset,
    defaultDurationMs: settings.targetSessionMinutes * 60_000,
  })

  const auth = useAuth()
  const { zenMode, toggleZen, exitZen } = useZenMode()

  useWakeLock(timer.hasSession || countdown.isActive)
  useDocumentTitle({
    valueMs: timer.activeMs,
    breakMs: timer.currentBreakMs,
    status: timer.status,
    presetLabel: activePreset.label,
    countdownStatus: countdown.status,
    countdownRemainingMs: countdown.remainingMs,
    countdownLabel: countdownPreset.label,
  })

  const reminderSource = timer.isRunning
    ? {
        status: 'running',
        elapsedMs: timer.activeMs,
        label: activePreset.label,
        sessionId: timer.sessionId,
      }
    : countdown.isRunning && countdownPreset.id !== 'break'
      ? {
          status: 'running',
          elapsedMs: countdown.elapsedMs,
          label: countdownPreset.label,
          sessionId: countdown.sessionId,
        }
      : { status: 'idle', elapsedMs: 0, label: '', sessionId: null }

  useFocusReminders({
    enabled: settings.remindersEnabled,
    minutes: settings.reminderMinutes,
    status: reminderSource.status,
    elapsedMs: reminderSource.elapsedMs,
    label: reminderSource.label,
    sessionId: reminderSource.sessionId,
    notificationsEnabled: settings.notificationsEnabled,
  })

  const cloud = useCloudSync({
    user: auth.user,
    sessions,
    settings,
    presets: customPresets,
    mergeSessions,
    mergePresets,
  })

  const clearAuthError = auth.clearError
  const openAuth = useCallback(() => {
    clearAuthError()
    setAuthOpen(true)
  }, [clearAuthError])
  const closeAuth = useCallback(() => {
    setAuthOpen(false)
    clearAuthError()
  }, [clearAuthError])

  const selectPreset = useCallback(
    (presetId) => {
      if (timer.hasSession) {
        notify('Finish the current session before changing activity.', 'info')
        return
      }
      setActivePresetId(presetId)
      timer.setPreset(presetId)
    },
    [notify, timer],
  )

  const selectCountdownPreset = useCallback(
    (presetId) => {
      if (countdown.isActive || countdown.isComplete) {
        notify('Finish or reset the countdown before changing activity.', 'info')
        return
      }
      setCountdownPresetId(presetId)
      countdown.setPreset(presetId)
    },
    [countdown, notify],
  )

  const handleUpdateSettings = useCallback(
    (patch) => {
      updateSettings(patch)
      if (
        patch &&
        typeof patch === 'object' &&
        patch.targetSessionMinutes != null &&
        countdown.isIdle
      ) {
        countdown.setDuration(Number(patch.targetSessionMinutes) * 60_000)
      }
    },
    [countdown, updateSettings],
  )

  const handleAddPreset = useCallback(
    (payload) => {
      const result = addPreset(payload)
      if (result.ok) {
        selectPreset(result.preset.id)
        notify(`${result.preset.label} added.`, 'success')
      }
      return result
    },
    [addPreset, notify, selectPreset],
  )

  const handleEditPreset = useCallback(
    (payload) => {
      const activity = presetDialog?.activity
      if (!activity) return { ok: false, error: 'No activity selected.' }
      const result = editPreset(activity.id, payload)
      if (result.ok) {
        notify(`${result.preset.label} updated.`, 'success')
      }
      return result
    },
    [editPreset, notify, presetDialog],
  )

  const handleDeletePreset = useCallback(
    (id) => {
      if (
        (timer.hasSession && activePresetId === id) ||
        (countdown.isActive && countdownPresetId === id)
      ) {
        notify('Finish the current session before removing this activity.', 'info')
        return
      }

      deletePreset(id)
      if (activePresetId === id) {
        setActivePresetId(DEFAULT_PRESET_ID)
        timer.setPreset(DEFAULT_PRESET_ID)
      }
      if (countdownPresetId === id) {
        setCountdownPresetId(DEFAULT_PRESET_ID)
        countdown.setPreset(DEFAULT_PRESET_ID)
      }
      notify('Custom activity removed. Past sessions are unchanged.', 'info')
    },
    [activePresetId, countdown, countdownPresetId, deletePreset, notify, timer],
  )

  const handleToggleZen = useCallback(() => {
    toggleZen()
  }, [toggleZen])

  const handleToggle = useCallback(() => {
    if (timer.status === 'idle' && countdown.isActive) {
      notify('Finish or reset the countdown before starting the stopwatch.', 'info')
      return
    }

    const wasRunning = timer.status === 'running'
    const wasPaused = timer.status === 'paused'
    const result = timer.toggle()
    if (!result?.ok) return

    if (wasRunning) {
      notify('Break started. Focus time is frozen.', 'info')
    } else if (wasPaused) {
      notify('Break saved. Next focus interval started.', 'success')
    } else {
      notify('Focus session started.', 'success')
    }
  }, [countdown.isActive, notify, timer])

  const handleCountdownToggle = useCallback(() => {
    if (countdown.isIdle && timer.hasSession) {
      notify('Finish or reset the stopwatch before starting the countdown.', 'info')
      return
    }

    const wasRunning = countdown.isRunning
    const wasPaused = countdown.isPaused
    const result = countdown.toggle()
    if (!result?.ok) return

    if (wasRunning) {
      notify('Countdown paused. Your remaining time is safe.', 'info')
    } else if (wasPaused) {
      notify('Countdown resumed.', 'success')
    } else {
      notify(
        `${countdownPreset.label} countdown started · ${formatClock(
          countdown.durationMs,
        )}`,
        'success',
      )
    }
  }, [countdown, countdownPreset.label, notify, timer.hasSession])

  const handleSplit = useCallback(() => {
    const result = timer.split()
    if (result.ok) {
      notify(`Split ${String(result.split.index).padStart(2, '0')} logged.`, {
        tone: 'success',
        replaceKey: 'split',
      })
    } else if (result.reason === 'too-short') {
      notify('Split checkpoints need at least 200 ms.', 'info')
    }
  }, [notify, timer])

  const handleStop = useCallback(() => {
    const result = timer.stop()

    if (!result.ok) {
      if (result.reason === 'idle') {
        notify('Start the session first.', 'info')
      } else if (result.reason === 'too-short') {
        notify('Give it at least one second before saving.', 'info')
      }
      return
    }

    const added = addSessions(result.records)
    if (added > 0) {
      setCompletedSession({ ...result.session, source: 'stopwatch' })
      notify(
        `Session saved · ${formatPreciseClock(result.session.totalActiveMs)} active`,
        'success',
      )
    } else {
      notify('This session was already saved.', 'info')
    }
  }, [addSessions, notify, timer])

  const handleReset = useCallback(() => {
    if (!timer.canReset) return
    if (timer.hasSession) {
      setResetTarget('stopwatch')
      return
    }
    timer.reset()
    notify('Stopwatch reset.', 'info')
  }, [notify, timer])

  const handleCountdownReset = useCallback(() => {
    if (countdown.isActive) {
      setResetTarget('countdown')
      return
    }
    countdown.reset()
    notify('Countdown reset.', 'info')
  }, [countdown, notify])

  const handleConfirmReset = useCallback(() => {
    const target = resetTarget
    setResetTarget(null)
    if (target === 'countdown') {
      countdown.reset()
      notify('Countdown discarded.', 'info')
    } else {
      timer.reset()
      notify('Session discarded.', 'info')
    }
  }, [countdown, notify, resetTarget, timer])

  const closeCompletedSession = useCallback(() => {
    const source = completedSession?.source
    setCompletedSession(null)
    if (source === 'countdown') countdown.acknowledgeCompletion()
  }, [completedSession?.source, countdown])

  const handleStartNew = useCallback(() => {
    const source = completedSession?.source
    const wasBreak = completedSession?.presetId === 'break'
    setCompletedSession(null)

    if (source === 'countdown') {
      countdown.acknowledgeCompletion()
      setView('timer')
      if (wasBreak) {
        const focusDurationMs = settings.targetSessionMinutes * 60_000
        setCountdownPresetId(activePreset.id)
        countdown.prepare({
          presetId: activePreset.id,
          durationMs: focusDurationMs,
        })
      }
      const result = countdown.start()
      if (result.ok) notify('Countdown started.', 'success')
      return
    }

    setView('stopwatch')
    const result = timer.start()
    if (result.ok) notify('Focus session started.', 'success')
  }, [
    activePreset.id,
    completedSession,
    countdown,
    notify,
    settings.targetSessionMinutes,
    timer,
  ])

  const handleTakeBreak = useCallback(() => {
    const source = completedSession?.source
    setCompletedSession(null)
    if (source === 'countdown') countdown.acknowledgeCompletion()
    setView('timer')
    setCountdownPresetId('break')
    countdown.prepare({
      presetId: 'break',
      durationMs: COUNTDOWN_BREAK_MINUTES * 60_000,
    })
    notify('Five minutes to breathe. Press Start when you are ready.', 'info')
  }, [completedSession?.source, countdown, notify])

  const handleViewHistory = useCallback(() => {
    closeCompletedSession()
    setView('history')
  }, [closeCompletedSession])

  const handleDeleteSession = useCallback(
    (id) => {
      deleteSession(id)
      notify('Session deleted.', 'info')
    },
    [deleteSession, notify],
  )

  const handleClearHistory = useCallback(async () => {
    clearSessions()
    if (auth.user) {
      await clearCloudHistory(auth.user.id).catch(() => {})
    }
    notify('History cleared. Goals and activities are untouched.', 'success')
  }, [auth.user, clearSessions, notify])

  const handleImportBackup = useCallback(
    (payload) => {
      if (!payload) return
      const addedSessions = mergeSessions(payload.sessions)
      const addedPresets = mergePresets(payload.presets)
      if (payload.settings) {
        updateSettings((previous) => ({ ...previous, ...payload.settings }))
        if (
          payload.settings.targetSessionMinutes != null &&
          countdown.isIdle
        ) {
          countdown.setDuration(
            Number(payload.settings.targetSessionMinutes) * 60_000,
          )
        }
      }
      notify(
        `Backup merged · ${addedSessions} new ${
          addedSessions === 1 ? 'record' : 'records'
        } and ${addedPresets} new ${
          addedPresets === 1 ? 'activity' : 'activities'
        }.`,
        'success',
      )
    },
    [countdown, mergePresets, mergeSessions, notify, updateSettings],
  )

  useEffect(() => {
    const completion = countdown.completion
    if (!completion) return
    if (handledCountdownRef.current === completion.sessionId) return

    handledCountdownRef.current = completion.sessionId
    const { records, ...summary } = completion
    const added = addSessions(records)
    setCompletedSession({ ...summary, source: 'countdown' })

    if (settings.soundEnabled) playCompletionChime()
    if (settings.notificationsEnabled) {
      const isBreak = summary.totalActiveMs === 0
      showBrowserNotification(
        isBreak ? 'Break complete' : 'Countdown complete',
        isBreak
          ? 'Your break is done. Return only when you feel ready.'
          : `${summary.presetLabel} · ${formatPreciseClock(
              summary.totalActiveMs,
            )} focused. Beautiful work.`,
      )
    }

    notify(
      added > 0
        ? `Countdown saved · ${formatPreciseClock(
            summary.totalActiveMs || summary.totalBreakMs,
          )}`
        : 'Countdown already saved.',
      'success',
    )
  }, [
    addSessions,
    countdown.completion,
    notify,
    settings.notificationsEnabled,
    settings.soundEnabled,
  ])

  const dialogOpen =
    authOpen ||
    Boolean(presetDialog) ||
    Boolean(resetTarget) ||
    Boolean(shareSession) ||
    Boolean(completedSession)

  useKeyboardShortcuts({
    enabled: (view === 'stopwatch' || view === 'timer') && !dialogOpen,
    onToggle: view === 'timer' ? handleCountdownToggle : handleToggle,
    onSplit: view === 'stopwatch' ? handleSplit : undefined,
    onReset: view === 'timer' ? handleCountdownReset : handleReset,
    onStop: view === 'stopwatch' ? handleStop : undefined,
    onZen: handleToggleZen,
    onExitZen: zenMode ? exitZen : undefined,
    zenEnabled: !dialogOpen,
  })

  const runningView = timer.hasSession
    ? 'stopwatch'
    : countdown.isActive
      ? 'timer'
      : null

  const renderView = () => {
    if (view === 'history') {
      return (
        <HistoryView
          sessions={sessions}
          onDeleteSession={handleDeleteSession}
          onShareSession={setShareSession}
          onOpenStopwatch={() => setView('stopwatch')}
        />
      )
    }

    if (view === 'analytics') {
      return (
        <AnalyticsView
          sessions={sessions}
          dailyGoalHours={settings.dailyGoalHours}
          onOpenStopwatch={() => setView('stopwatch')}
        />
      )
    }

    if (view === 'settings') {
      return (
        <SettingsView
          settings={settings}
          updateSettings={handleUpdateSettings}
          sessions={sessions}
          customPresets={customPresets}
          onCreateActivity={() => setPresetDialog({ activity: null })}
          onEditActivity={(activity) => setPresetDialog({ activity })}
          onDeletePreset={handleDeletePreset}
          onImportBackup={handleImportBackup}
          onClearHistory={handleClearHistory}
          user={auth.user}
          onOpenAuth={openAuth}
          cloud={cloud}
        />
      )
    }

    if (view === 'timer') {
      return (
        <CountdownView
          key={`${countdown.presetId}-${countdown.status}`}
          countdown={countdown}
          preset={countdownPreset}
          presets={[BREAK_PRESET, ...presets]}
          sessions={sessions}
          zenMode={zenMode}
          onToggleZen={handleToggleZen}
          onSelectPreset={selectCountdownPreset}
          onOpenCustomPreset={() => setPresetDialog({ activity: null })}
          onToggle={handleCountdownToggle}
          onReset={handleCountdownReset}
          onSetDuration={countdown.setDuration}
          focusWorldEnabled={settings.focusWorldEnabled}
          animationsEnabled={settings.animationsEnabled}
          reducedMotion={settings.reducedMotion}
        />
      )
    }

    return (
      <StopwatchView
        timer={timer}
        preset={activePreset}
        presets={presets}
        sessions={sessions}
        zenMode={zenMode}
        onToggleZen={handleToggleZen}
        onSelectPreset={selectPreset}
        onOpenCustomPreset={() => setPresetDialog({ activity: null })}
        onToggle={handleToggle}
        onSplit={handleSplit}
        onStop={handleStop}
        onReset={handleReset}
        focusWorldEnabled={settings.focusWorldEnabled}
        animationsEnabled={settings.animationsEnabled}
        reducedMotion={settings.reducedMotion}
      />
    )
  }

  return (
    <>
      <AppShell
        zenMode={zenMode}
        topBar={
          <TopBar
            activeView={view}
            onNavigate={setView}
            onOpenStopwatch={() => setView('stopwatch')}
            showRunningDot={Boolean(runningView)}
            runningView={runningView}
            isDark={isDark}
            onToggleTheme={() =>
              updateSettings({ theme: isDark ? 'light' : 'dark' })
            }
            user={auth.user}
            onOpenAuth={openAuth}
            syncing={cloud.syncing}
          />
        }
        activeView={view}
        onNavigate={setView}
        showRunningDot={Boolean(runningView)}
        runningView={runningView}
        user={auth.user}
      >
        {renderView()}
      </AppShell>

      {authOpen && (
        <AuthDialog
          open
          onClose={closeAuth}
          auth={auth}
          cloud={cloud}
          sessionCount={sessions.length}
        />
      )}

      <ShareSessionDialog
        session={shareSession}
        open={Boolean(shareSession)}
        onClose={() => setShareSession(null)}
        userName={auth.user?.name}
      />

      {presetDialog && (
        <CustomPresetDialog
          key={presetDialog.activity?.id ?? 'new-activity'}
          open
          activity={presetDialog.activity}
          onClose={() => setPresetDialog(null)}
          onAdd={handleAddPreset}
          onSave={handleEditPreset}
        />
      )}

      <SessionSummaryModal
        key={completedSession?.id ?? 'empty'}
        session={completedSession}
        sessions={sessions}
        focusWorldEnabled={settings.focusWorldEnabled}
        open={Boolean(completedSession)}
        onClose={closeCompletedSession}
        onStartNew={handleStartNew}
        onTakeBreak={handleTakeBreak}
        onViewHistory={handleViewHistory}
      />

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={
          resetTarget === 'countdown'
            ? 'Discard this countdown?'
            : 'Reset this session?'
        }
        description={
          resetTarget === 'countdown'
            ? `${formatClock(countdown.durationMs)} will be discarded. Only completed countdowns are saved.`
            : `${formatPreciseClock(timer.activeMs)} of active focus will be discarded. Breaks and splits are discarded too.`
        }
        size="sm"
        footer={
          <div className="flex w-full flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
            <Button variant="secondary" onClick={() => setResetTarget(null)}>
              Keep going
            </Button>
            <Button variant="danger" onClick={handleConfirmReset}>
              Discard &amp; reset
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          This clears the running timer and its in-progress data. Nothing is saved
          to history.
        </p>
      </Modal>

      <Analytics />
    </>
  )
}
