import { useEffect, useState } from 'react';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallEvent = Event & { prompt: () => Promise<any>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = 'showup:install-dismissed';

export function InstallPrompt({ ready }: { ready: boolean }) {
  const [evt, setEvt] = useState<BeforeInstallEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!ready || dismissed || !evt) return null;

  return (
    <Card className="mt-4 border-tertiary/50 bg-tertiary-soft/50 shadow-glow-tertiary">
      <p className="text-sm font-semibold text-ink">Install Showup</p>
      <p className="mt-1 text-sm text-muted">
        Add it to your home screen for one-tap launch. Works fully offline once installed.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            try {
              await evt.prompt();
              await evt.userChoice;
            } catch {
              /* ignore */
            }
            setEvt(null);
          }}
        >
          Install
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1');
            setDismissed(true);
          }}
        >
          Not now
        </Button>
      </div>
    </Card>
  );
}
