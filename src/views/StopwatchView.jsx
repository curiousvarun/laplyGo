import { useMemo } from 'react'
import { PresetPicker } from '../components/timer/PresetPicker.jsx'
import { TimerStage } from '../components/timer/TimerStage.jsx'
import { LiveStats } from '../components/timer/LiveStats.jsx'
import { ActivityTimeline } from '../components/timer/ActivityTimeline.jsx'
import { FocusStudio } from '../components/focus/FocusStudio.jsx'
import { computeFocusStats } from '../utils/focusSession.js'

export function StopwatchView({
  timer,
  preset,
  presets,
  sessions,
  zenMode,
  onToggleZen,
  onSelectPreset,
  onOpenCustomPreset,
  onToggle,
  onSplit,
  onStop,
  onReset,
  focusWorldEnabled = true,
  animationsEnabled = true,
  reducedMotion = false,
}) {
  const stats = useMemo(
    () => computeFocusStats(sessions, timer.liveStats),
    [sessions, timer.liveStats],
  )

  const stage = (
    <TimerStage
      timer={timer}
      preset={preset}
      zen={zenMode}
      onToggle={onToggle}
      onSplit={onSplit}
      onStop={onStop}
      onReset={onReset}
      onZen={onToggleZen}
    />
  )

  if (zenMode) {
    return (
      <div className="fixed inset-0 z-50 h-dvh w-screen overflow-y-auto bg-[#09090b] text-zinc-50">
        {stage}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-8">
      <h1 className="sr-only">
        LaplyGo — precision online stopwatch with automatic focus and break tracking
      </h1>

      <PresetPicker
        presets={presets}
        selectedId={preset.id}
        onSelect={onSelectPreset}
        onAdd={onOpenCustomPreset}
        disabled={timer.hasSession}
      />

      {stage}

      <LiveStats stats={stats} />

      <FocusStudio
        sessions={sessions}
        liveFocusMs={timer.activeMs}
        status={
          timer.isRunning ? 'focusing' : timer.isPaused ? 'resting' : 'idle'
        }
        enabled={focusWorldEnabled}
        animate={animationsEnabled && !reducedMotion}
      />

      <ActivityTimeline
        entries={timer.timeline}
        title="Session timeline"
        subtitle="Focus intervals, breaks, and split checkpoints — always kept separate."
        empty="Press Start or Space to open the first interval."
      />
    </div>
  )
}
