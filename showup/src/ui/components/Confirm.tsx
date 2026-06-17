import { Sheet } from './Sheet';
import { Button } from './Button';
import { strings } from '@/copy/strings';

interface ConfirmProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel = strings.settings.confirm,
  cancelLabel = strings.settings.cancel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Sheet open={open} onClose={onCancel} title={title} description={body}>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
        <Button
          fullWidth
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button fullWidth variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Sheet>
  );
}
