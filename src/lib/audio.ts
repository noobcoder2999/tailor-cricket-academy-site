export class CricketAudio {
  private context: AudioContext | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  async enable() {
    this.context ??= new AudioContext();
    await this.context.resume();
  }
  contact() {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running") return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(220, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
    this.sources.push(oscillator);
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    const ambience = ctx.createGain();
    ambience.gain.setValueAtTime(0.1, ctx.currentTime);
    ambience.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    noise.connect(filter).connect(ambience).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 1);
    this.sources.push(noise);
  }
  async dispose() {
    for (const source of this.sources) source.disconnect();
    this.sources = [];
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") await context.close();
  }
}
