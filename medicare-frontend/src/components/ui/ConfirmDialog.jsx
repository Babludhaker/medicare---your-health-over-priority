import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * ConfirmDialog — a yes/no confirmation modal. Driven by the
 * useConfirm hook; spread its `props` onto this component.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === 'danger' && (
          <div className="shrink-0 rounded-xl bg-clay-100 p-2.5">
            <AlertTriangle className="h-5 w-5 text-clay-600" />
          </div>
        )}
        <p className="text-sm leading-relaxed text-paper-600">{message}</p>
      </div>
    </Modal>
  );
}
