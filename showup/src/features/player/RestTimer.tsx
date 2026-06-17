import { useEffect, useRef, useState } from 'react';
import { strings } from '@/copy/strings';
import { Button } from '@/ui/components/Button';
import { chime } from '@/lib/sound';
import { vibrate } from '@/lib/featureDetect';
import { prettyTime } from '@/lib/time';

interface RestTimerProps {
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
}

export function RestTimer({ seconds, onDone, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const totalRef = useRef(seconds);
  const startRef = useRef<number>(Date.now());
  const baseRef = useRef<number>(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = Math.max(0, Math.round(baseRef.current - elapsed));
      setRemaining(left);
      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        chime();
        vibrate([200, 100, 200]);
        setTimeout(onDone, 250);
      }
    };
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjust = (delta: number) => {
    const elapsed = (Date.now() - startRef.current) / 1000;
    baseRef.current = Math.max(0, baseRef.current - elapsed + remaining + delta);
    // Easiest: reset baseline using the displayed remaining + delta.
    baseRef.current = Math.max(0, remaining + delta);
    startRef.current = Date.now();
    totalRef.current = Math.max(totalRef.current, baseRef.current);
    firedRef.current = false;
    setRemaining(baseRef.current);
  };

  const pct = totalRef.current > 0 ? (remaining / totalRef.current) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {strings.player.rest}
      </p>
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220">
          <circle
            cx="110"
            cy="110"
            r="100"
            stroke="rgb(var(--color-border))"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="110"
            cy="110"
            r="100"
            stroke="rgb(var(--color-tertiary))"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={(2 * Math.PI * 100) * (1 - pct / 100)}
            transform="rotate(-90 110 110)"
            style={{ transition: 'stroke-dashoffset 220ms linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-semibold tabular-nums tracking-tight text-ink">
            {prettyTime(remaining)}
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => adjust(-15)}>
          −15s
        </Button>
        <Button variant="ghost" onClick={() => adjust(15)}>
          +15s
        </Button>
      </div>
      <Button variant="soft" onClick={onSkip}>
        {strings.player.skipRest}
      </Button>
    </div>
  );
}
