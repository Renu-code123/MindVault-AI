/**
 * Zero-dependency client-side Ambient Soundscape Synthesizer using Web Audio API.
 * Provides mindful acoustic focus for personal journaling without downloading external media files.
 */

export type SoundscapeType = "rain" | "ocean" | "binaural" | "brownNoise";

class SoundscapePlayer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentSound: SoundscapeType | null = null;
  private gainNode: GainNode | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private activeNodes: any[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public play(type: SoundscapeType, volume = 0.2) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (type === "rain") {
      this.createRainSound();
    } else if (type === "ocean") {
      this.createOceanWaves();
    } else if (type === "brownNoise") {
      this.createBrownNoise();
    } else if (type === "binaural") {
      this.createBinauralBeats();
    }

    this.isPlaying = true;
    this.currentSound = type;
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        if (typeof node.stop === "function") node.stop();
        node.disconnect();
      } catch {
        // Safe disposal
      }
    });
    this.activeNodes = [];

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // Safe disposal
      }
      this.gainNode = null;
    }

    this.isPlaying = false;
    this.currentSound = null;
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public getStatus() {
    return { isPlaying: this.isPlaying, currentSound: this.currentSound };
  }

  private createBrownNoise() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Lowpass filter for deep soothing resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter);
  }

  private createRainSound() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Bandpass filter centered around rain frequencies
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(this.gainNode);
    noiseSource.start();
    this.activeNodes.push(noiseSource, filter);
  }

  private createOceanWaves() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter modulated by LFO for surging wave effect
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(this.gainNode);

    lfo.start();
    noiseSource.start();
    this.activeNodes.push(noiseSource, filter, lfo, lfoGain);
  }

  private createBinauralBeats() {
    if (!this.ctx || !this.gainNode) return;

    // 196 Hz in left ear, 202 Hz in right ear -> 6 Hz Theta wave state for introspective reflection
    const merger = this.ctx.createChannelMerger(2);

    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.setValueAtTime(196, this.ctx.currentTime);

    const oscRight = this.ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.setValueAtTime(202, this.ctx.currentTime);

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);
    merger.connect(this.gainNode);

    oscLeft.start();
    oscRight.start();
    this.activeNodes.push(oscLeft, oscRight, merger);
  }
}

export const ambientSound = new SoundscapePlayer();
