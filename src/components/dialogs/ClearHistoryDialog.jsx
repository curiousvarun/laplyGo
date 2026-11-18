import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'

/**
 * Two-step destructive confirmation. State resets whenever the dialog is
 * dismissed through the UI, so reopening always starts at step one.
 */
export function ClearHistoryDialog({ open, sessionCount, onConfirm, onCancel }) {
  const [step, setStep] = useState(0)

  const handleCancel = () => {
    setStep(0)
    onCancel()
  }

  const handleConfirm = () => {
    setStep(0)
    onConfirm()
  }

  if (step === 0) {
    return (
      <Modal
        open={open}
        onClose={handleCancel}
        title="Clear all history?"
        description={`${sessionCount} saved ${
          sessionCount === 1 ? 'record' : 'records'
        } will be removed from this browser.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setStep(1)}>
              Continue
            </Button>
          </>
        }
      />
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="Delete everything permanently?"
      description="This cannot be undone."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel}>
            Keep my data
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Delete all history
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          You are about to permanently delete{' '}
          <span className="font-bold">{sessionCount}</span>{' '}
          {sessionCount === 1 ? 'record' : 'records'}.
        </p>
      </div>
    </Modal>
  )
}
