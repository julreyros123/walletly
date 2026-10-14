import { Platform } from 'react-native';
import { safeHaptic } from './haptics';
import { usePreferencesStore } from '@/store/preferencesStore';

const SOUND_SOURCES = {
  swipe: require('../../assets/sounds/swipe.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  combo: require('../../assets/sounds/combo.wav'),
  complete: require('../../assets/sounds/complete.wav'),
};

type SoundKey = keyof typeof SOUND_SOURCES;

// Safe lazy-load of expo-audio
let ExpoAudio: any = null;
if (Platform.OS !== 'web') {
  try {
    ExpoAudio = require('expo-audio');
  } catch (_) {
    // expo-audio not available in this environment
  }
}

// Universal Audio Synthesizer & Native Audio Player
class SoundFXEngine {
  private audioCtx: any = null;
  private nativePlayers: Partial<Record<SoundKey, any>> = {};

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

  private playNativeSound(key: SoundKey) {
    try {
      const isSoundEnabled = usePreferencesStore.getState().soundEffectsEnabled;
      if (!isSoundEnabled) return;

      if (!ExpoAudio || typeof ExpoAudio.createAudioPlayer !== 'function') return;

      if (!this.nativePlayers[key]) {
        this.nativePlayers[key] = ExpoAudio.createAudioPlayer(SOUND_SOURCES[key]);
      }

      const player = this.nativePlayers[key];
      if (player) {
        if (typeof player.seekTo === 'function') {
          player.seekTo(0);
        }
        if (typeof player.play === 'function') {
          player.play();
        }
      }
    } catch (e) {
      // Graceful fallback: audio failure should never crash the app
    }
  }

  private playTone(
    freq: number,
    duration = 0.12,
    type: 'sine' | 'triangle' | 'square' | 'sawtooth' = 'sine',
    gainVal = 0.15
  ) {
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
    if (Platform.OS !== 'web') {
      this.playNativeSound('swipe');
      return;
    }
    const ctx = this.getAudioContext();
    if (ctx) {
      this.playTone(320, 0.08, 'triangle', 0.12);
      setTimeout(() => this.playTone(480, 0.08, 'triangle', 0.1), 30);
    }
  }

  // 2. Correct stock prediction chime (Upbeat 3-tone chime)
  playCorrect() {
    safeHaptic('heavy');
    if (Platform.OS !== 'web') {
      this.playNativeSound('correct');
      return;
    }
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
    if (Platform.OS !== 'web') {
      this.playNativeSound('wrong');
      return;
    }
    const ctx = this.getAudioContext();
    if (ctx) {
      this.playTone(220, 0.15, 'sawtooth', 0.15);
      setTimeout(() => this.playTone(174.61, 0.25, 'sawtooth', 0.15), 100);
    }
  }

  // 4. 🔥 3+ Fire Streak Combo Fanfare
  playCombo() {
    safeHaptic('heavy');
    if (Platform.OS !== 'web') {
      this.playNativeSound('combo');
      return;
    }
    const ctx = this.getAudioContext();
    if (ctx) {
      this.playTone(440, 0.08, 'square', 0.15); // A4
      setTimeout(() => this.playTone(554.37, 0.08, 'square', 0.18), 70); // C#5
      setTimeout(() => this.playTone(659.25, 0.1, 'square', 0.2), 140); // E5
      setTimeout(() => this.playTone(880, 0.25, 'square', 0.25), 210); // A5
    }
  }

  // 5. Round Complete Fanfare
  playRoundComplete() {
    safeHaptic('heavy');
    if (Platform.OS !== 'web') {
      this.playNativeSound('complete');
      return;
    }
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
