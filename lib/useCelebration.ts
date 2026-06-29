'use client';

import { useCallback, useRef } from 'react';

const COLORS = ['#8a7a6b', '#18181b', '#f0ede8', '#c4b7a6', '#9c5a52'];

/** Plays a short synthesized "pop" using the Web Audio API — no audio file
 *  needed. A quick sine blip with a fast exponential decay reads as a
 *  satisfying little pop rather than a harsh beep. */
function playPop(audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Audio is a nice-to-have; never let it break the actual task completion.
  }
}

/** Bursts small colored particles outward from a given screen position
 *  using absolutely-positioned divs animated with the Web Animations API,
 *  then cleans itself up. No canvas/library needed for a one-shot burst. */
function burstConfetti(x: number, y: number) {
  const particleCount = 14;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const size = 5 + Math.random() * 4;
    const color = COLORS[i % COLORS.length];
    particle.style.position = 'absolute';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = color;
    particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(particle);

    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const distance = 40 + Math.random() * 50;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 20; // bias upward slightly

    particle.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy + 60}px) scale(0.4)`,
          opacity: 0,
        },
      ],
      {
        duration: 600 + Math.random() * 300,
        easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
      }
    );
  }

  setTimeout(() => container.remove(), 1000);
}

/** Returns a `celebrate(event)` function: call it from a checkbox's onClick
 *  handler (passing the click event) to fire a confetti burst from that
 *  exact spot plus a pop sound. Respects prefers-reduced-motion by skipping
 *  the confetti animation (sound still plays, since it's not motion). */
export function useCelebration() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const celebrate = useCallback((e?: React.MouseEvent) => {
    playPop(audioCtxRef);

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reducedMotion) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (e) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    burstConfetti(x, y);
  }, []);

  return celebrate;
}
