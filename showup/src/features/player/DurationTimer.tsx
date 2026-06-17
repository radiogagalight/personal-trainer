import { useEffect, useRef, useState } from 'react';
import { prettyTime } from '@/lib/time';
import { Button } from '@/ui/components/Button';
import { chime } from '@/lib/sound';
import { vibrate } from '@/lib/featureDetect';

interface DurationTimerProps {
  targetSec?: number;
  /** Called when count-down hits zero, or user taps stop. Provides elapsed seconds. */
  onComplete: (elapsedSec: number) => void;
}

export function DurationTimer({ targetSec, onComplete }: DurationTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(s);
      if (targetSec && s >= targetSec && !firedRef.current) {
        firedRef.current = true;
        chime();
        vibrate([200, 100, 200]);
        onComplete(s);
      }
    };
    const i = window.setInterval(tick, 250);
    return () => window.clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = targetSec ? Math.max(0, targetSec - elapsed) : null;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted">
        {remaining !== null ? 'Time left' : 'Elapsed'}
      </span>
      <span className="text-6xl font-semibold tabular-nums tracking-tight text-ink">
        {remaining !== null ? prettyTime(remaining) : prettyTime(elapsed)}
      </span>
      <Button onClick={() => onComplete(elapsed)}>Stop</Button>
    </div>
  );
}
