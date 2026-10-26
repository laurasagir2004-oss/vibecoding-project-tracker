// Small browser effects. None of them carry information on their own:
// every celebration also shows a visible toast (accessibility: deaf / reduced motion).

// The Motion setting (Settings → Accessibility) can override the device preference.
export const prefersReducedMotion = () => {
  const choice = document.documentElement.dataset.motion;
  if (choice === 'reduce') return true;
  if (choice === 'allow') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
};

// Confetti burst (variable reward). Skipped for users who prefer less motion.
export function celebrate(x = window.innerWidth / 2, y = window.innerHeight / 3) {
  if (prefersReducedMotion()) return;
  const colours = ['#111827', '#6B7280', '#0F766E', '#6D28D9', '#FBBF24'];
  for (let i = 0; i < 40; i++) {
    const bit = document.createElement('span');
    const size = 6 + Math.random() * 6;
    Object.assign(bit.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size * 0.6}px`,
      background: colours[i % colours.length],
      borderRadius: '2px',
      pointerEvents: 'none',
      zIndex: 60,
    });
    bit.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bit);
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 120;
    bit
      .animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * distance}px, ${
              Math.sin(angle) * distance + 80
            }px) rotate(${Math.random() * 720}deg)`,
            opacity: 0,
          },
        ],
        { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.4,1)' },
      )
      .finished.then(() => bit.remove());
  }
}

// A soft two-note chime made in the browser (no sound file needed).
export function playShipSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  } catch {
    /* sound is a nice-to-have; never break the app over it */
  }
}

// Copy text to the clipboard, with a fallback for older browsers.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}
