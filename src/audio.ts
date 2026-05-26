/**
 * Procedural Synthesizer for Arcade Sound Effects using HTML5 Web Audio API.
 * 
 * Works purely in the browser without requiring external audio assets.
 * Gracefully handles browser policies (auto-play blocking) by initializing on first user interaction.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Attempt to load mute state from local storage
    try {
      const savedMute = localStorage.getItem('neon_arcade_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch {
      this.isMuted = false;
    }
  }

  // Initialize or resume AudioContext
  private initContext(): boolean {
    if (this.isMuted) return false;
    
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    return !!this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('neon_arcade_muted', String(this.isMuted));
    } catch (e) {
      console.warn('Could not save mute state', e);
    }
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Laser Shoot Sound (Frequency sweep DOWN)
   * A short square/sawtooth wave that drops rapidly in frequency
   */
  public playLaser(type: 'NORMAL' | 'SPREAD' | 'OVERCHARGE' | 'ENEMY' = 'NORMAL') {
    if (!this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      let startFreq = 880;
      let endFreq = 220;
      let duration = 0.15;
      let waveType: OscillatorType = 'triangle';

      if (type === 'SPREAD') {
        startFreq = 1200;
        endFreq = 400;
        duration = 0.12;
        waveType = 'sawtooth';
      } else if (type === 'OVERCHARGE') {
        startFreq = 1600;
        endFreq = 600;
        duration = 0.08;
        waveType = 'sine';
      } else if (type === 'ENEMY') {
        startFreq = 300;
        endFreq = 80;
        duration = 0.2;
        waveType = 'sawtooth';
      }

      osc.type = waveType;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.error('Audio playLaser fail', e);
    }
  }

  /**
   * Explosion Sound (Filtered noise or intense low frequency rumble)
   */
  public playExplosion(type: 'NORMAL' | 'BOSS' | 'METEOR' = 'NORMAL') {
    if (!this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = type === 'BOSS' ? 1.5 : type === 'METEOR' ? 0.6 : 0.4;
      
      // We can generate noise manually using a buffer
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filterNode = this.ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      
      let startCutoff = 800;
      let endCutoff = 100;

      if (type === 'BOSS') {
        startCutoff = 400;
        endCutoff = 30;
      } else if (type === 'METEOR') {
        startCutoff = 600;
        endCutoff = 60;
      }

      filterNode.frequency.setValueAtTime(startCutoff, now);
      filterNode.frequency.exponentialRampToValueAtTime(endCutoff, now + duration);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(type === 'BOSS' ? 0.4 : 0.25, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + duration);

      noiseNode.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + duration);

      // Add a sub-bass rumble for chunky explosions
      if (type === 'BOSS' || type === 'METEOR') {
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(100, now);
        subOsc.frequency.linearRampToValueAtTime(20, now + duration);
        
        subGain.gain.setValueAtTime(0.35, now);
        subGain.gain.linearRampToValueAtTime(0.001, now + duration);
        
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + duration);
      }
    } catch (e) {
      console.error('Audio playExplosion fail', e);
    }
  }

  /**
   * Power-up Collection Sound (Ascending arpeggio)
   */
  public playPowerUp() {
    if (!this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major pentatonic
      const noteDuration = 0.08;

      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * noteDuration);

        // Visual tremolo / vibrato for extra electronic cyber feel
        gainNode.gain.setValueAtTime(0, now + index * noteDuration);
        gainNode.gain.linearRampToValueAtTime(0.12, now + index * noteDuration + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + index * noteDuration + noteDuration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now + index * noteDuration);
        osc.stop(now + index * noteDuration + noteDuration);
      });
    } catch (e) {
      console.error('Audio playPowerUp fail', e);
    }
  }

  /**
   * Hit / Damage Sound (Brief unpleasant sawtooth buzz)
   */
  public playHit() {
    if (!this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.15);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.error('Audio playHit fail', e);
    }
  }

  /**
   * Game Over Sound (Descending pitch sliding into sadness)
   */
  public playGameOver() {
    if (!this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 1.0;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(60, now + duration);

      // Low pass filter sweeps down
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.linearRampToValueAtTime(100, now + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.error('Audio playGameOver fail', e);
    }
  }
}

export const sound = new SoundEngine();
export default sound;
