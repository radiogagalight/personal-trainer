/** Tiny WebAudio chime — no external file required. */
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

export function chime(): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(1320, now + 0.18);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    o.connect(g).connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.6);
  } catch {
    /* swallow */
  }
}
