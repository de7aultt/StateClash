import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';

interface ToneSpec {
  type: OscillatorType;
  from: number;
  to: number;
  duration: number;
  volume: number;
  delay?: number;
}

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;
const SILENT_GAIN = 0.0001;
const ATTACK_SECONDS = 0.005;
const STOP_PADDING_SECONDS = 0.02;
const CLASH_THROTTLE_SECONDS = 0.04;

const NOTE = {
  a3: 220,
  c4: 261.63,
  e4: 329.63,
  d4: 293.66,
  f4: 349.23,
  a4: 440,
  c5: 523.25,
  e5: 659.25,
  g5: 783.99,
  c6: 1046.5,
} as const;

function holdTone(type: OscillatorType, frequency: number, duration: number, volume: number, delay: number): ToneSpec {
  return { type, from: frequency, to: frequency, duration, volume, delay };
}

export class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private lastClashTime = -Infinity;

  constructor(bus: EventBus<GameEventMap>) {
    bus.on('visibility:changed', ({ hidden }) => this.handleVisibility(hidden));
    for (const eventName of UNLOCK_EVENTS) window.addEventListener(eventName, this.unlock, { passive: true });
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 1;
    return this.muted;
  }

  playSelect(): void {
    this.playTone({ type: 'sine', from: 400, to: 800, duration: 0.06, volume: 0.15 });
  }

  playClash(): void {
    if (!this.context || this.context.currentTime - this.lastClashTime < CLASH_THROTTLE_SECONDS) return;
    this.lastClashTime = this.context.currentTime;
    this.playTone({ type: 'square', from: 700, to: 120, duration: 0.035, volume: 0.05 });
  }

  playTowerZap(): void {
    this.playTone({ type: 'sawtooth', from: 1200, to: 300, duration: 0.08, volume: 0.07 });
  }

  playCapture(): void {
    this.playTone({ type: 'sine', from: 160, to: 45, duration: 0.4, volume: 0.6 });
  }

  playUpgrade(): void {
    [NOTE.c5, NOTE.e5, NOTE.g5, NOTE.c6].forEach((frequency, index) => {
      this.playTone(holdTone('triangle', frequency, 0.15, 0.18, index * 0.05));
    });
  }

  playVictory(): void {
    this.playSequence([
      holdTone('triangle', NOTE.c5, 0.18, 0.2, 0),
      holdTone('triangle', NOTE.e5, 0.18, 0.2, 0.14),
      holdTone('triangle', NOTE.g5, 0.18, 0.2, 0.28),
      holdTone('triangle', NOTE.c5, 0.9, 0.16, 0.45),
      holdTone('triangle', NOTE.e5, 0.9, 0.16, 0.45),
      holdTone('triangle', NOTE.g5, 0.9, 0.16, 0.45),
      holdTone('triangle', NOTE.c6, 0.9, 0.12, 0.45),
    ]);
  }

  playDefeat(): void {
    this.playSequence([
      holdTone('triangle', NOTE.a4, 0.3, 0.2, 0),
      holdTone('triangle', NOTE.f4, 0.3, 0.2, 0.25),
      holdTone('triangle', NOTE.d4, 0.3, 0.2, 0.5),
      holdTone('sawtooth', NOTE.a3, 1.0, 0.08, 0.8),
      holdTone('sawtooth', NOTE.c4, 1.0, 0.08, 0.8),
      holdTone('sawtooth', NOTE.e4, 1.0, 0.08, 0.8),
    ]);
  }

  private readonly unlock = (): void => {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.context.destination);
    }
    if (!document.hidden) void this.context.resume();
    for (const eventName of UNLOCK_EVENTS) window.removeEventListener(eventName, this.unlock);
  };

  private handleVisibility(hidden: boolean): void {
    if (!this.context) return;
    if (hidden) void this.context.suspend();
    else void this.context.resume();
  }

  private playSequence(tones: readonly ToneSpec[]): void {
    for (const tone of tones) this.playTone(tone);
  }

  private playTone(spec: ToneSpec): void {
    const context = this.context;
    if (!context || !this.master || context.state !== 'running') return;
    const start = context.currentTime + (spec.delay ?? 0);
    const end = start + spec.duration;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = spec.type;
    oscillator.frequency.setValueAtTime(spec.from, start);
    oscillator.frequency.exponentialRampToValueAtTime(spec.to, end);
    envelope.gain.setValueAtTime(SILENT_GAIN, start);
    envelope.gain.exponentialRampToValueAtTime(spec.volume, start + ATTACK_SECONDS);
    envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, end);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(start);
    oscillator.stop(end + STOP_PADDING_SECONDS);
  }
}
