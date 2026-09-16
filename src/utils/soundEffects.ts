import { Platform } from 'react-native';
import { safeHaptic } from './haptics';
import { usePreferencesStore } from '@/store/preferencesStore';

// Universal Audio Synthesizer for instant zero-latency game sound effects
class SoundFXEngine {
  private audioCtx: any = null;

  private getAudioContext() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        return this.audioCtx;
      }
    }
    return null;
  }

  private playTone(freq: number, duration = 0.12, type: 'sine' | 'triangle' | 'square' = 'sine', gainVal = 0.15) {
    try {
      const isSoundEnabled = usePreferencesStore.getState().soundEffectsEnabled;
      if (!isSoundEnabled) return;

      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Graceful fallback
    }
  }

  // 1. Whoosh / Swipe sound
  playSwipe() {
    safeHaptic('light');
    const ctx = this.getAudioContext();
    if (ctx) {
      this.playTone(320, 0.08, 'triangle', 0.12);
      setTimeout(() => this.playTone(480, 0.08, 'triangle', 0.1), 30);
    }
  }

  // 2. Correct stock prediction chime (Upbeat 2-tone)
  playCorrect() {
    safeHaptic('heavy');
    const ctx = this.getAudioContext();
    if (ctx) {
      this.playTone(523.25, 0.1, 'sine', 0.2); // C5
      setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.22), 90); // E5
      setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.25), 180); // G5
    }
  }

  // 3. Wrong prediction / Market drop thud
  playWrong() {
    safeHaptic('error');
    const ctx = this.getAudioContext();
    if (ctx) {
      this.playTone(220, 0.15, 'sawtooth' as any, 0.15);
      setTimeout(() => this.playTone(174.61, 0.25, 'sawtooth' as any, 0.15), 100);
    }
  }

  // 4. 🔥 3+ Fire Streak Combo Fanfare
  playCombo() {
    safeHaptic('heavy');
    const ctx = this.getAudioContext();
    if (ctx) {
      this.playTone(440, 0.08, 'square', 0.15); // A4
      setTimeout(() => this.playTone(554.37, 0.08, 'square', 0.18), 70); // C#5
      setTimeout(() => this.playTone(659.25, 0.1, 'square', 0.2), 140); // E5
      setTimeout(() => this.playTone(880, 0.25, 'square', 0.25), 210); // A5 (High bell!)
    }
  }

  // 5. Round Complete Fanfare
  playRoundComplete() {
    safeHaptic('heavy');
    const ctx = this.getAudioContext();
    if (ctx) {
      this.playTone(523.25, 0.1, 'triangle', 0.2);
      setTimeout(() => this.playTone(659.25, 0.1, 'triangle', 0.2), 100);
      setTimeout(() => this.playTone(783.99, 0.12, 'triangle', 0.22), 200);
      setTimeout(() => this.playTone(1046.5, 0.35, 'triangle', 0.28), 300); // High C6
    }
  }
}

export const soundFX = new SoundFXEngine();
