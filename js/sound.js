const Sound = {
    ctx: null,
    masterGain: null,
    enabled: true,
    
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
        } catch(e) {
            this.enabled = false;
        }
    },
    
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    
    playTone(freq, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    
    playNoise(duration, volume = 0.2, filterFreq = 1000) {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    },
    
    gunshot(type) {
        if (!this.enabled) return;
        this.resume();
        if (type === 'KNIFE') {
            this.playTone(200, 0.1, 'sawtooth', 0.2);
            this.playNoise(0.05, 0.3, 2000);
        } else if (type === 'SHOTGUN') {
            this.playNoise(0.3, 0.5, 800);
            this.playTone(80, 0.2, 'square', 0.3);
            this.playTone(40, 0.3, 'sawtooth', 0.2);
        } else if (type === 'RIFLE') {
            this.playNoise(0.15, 0.4, 1500);
            this.playTone(120, 0.1, 'square', 0.25);
        } else if (type === 'PISTOL') {
            this.playNoise(0.2, 0.3, 1200);
            this.playTone(150, 0.1, 'square', 0.2);
        }
    },
    
    reload() {
        if (!this.enabled) return;
        this.resume();
        this.playTone(300, 0.05, 'square', 0.15);
        setTimeout(() => this.playTone(200, 0.05, 'square', 0.15), 200);
        setTimeout(() => this.playTone(400, 0.05, 'square', 0.15), 500);
    },
    
    zombieHit() {
        if (!this.enabled) return;
        this.resume();
        this.playTone(100 + Math.random()*50, 0.15, 'sawtooth', 0.2);
        this.playNoise(0.1, 0.15, 500);
    },
    
    zombieDie() {
        if (!this.enabled) return;
        this.resume();
        this.playTone(80, 0.3, 'sawtooth', 0.3);
        this.playNoise(0.3, 0.3, 300);
    },
    
    zombieGrowl() {
        if (!this.enabled) return;
        this.resume();
        const freq = 80 + Math.random() * 40;
        this.playTone(freq, 0.4, 'sawtooth', 0.08);
    },
    
    playerHurt() {
        if (!this.enabled) return;
        this.resume();
        this.playTone(200, 0.15, 'square', 0.3);
        this.playTone(100, 0.2, 'sawtooth', 0.2);
    },
    
    pickup(type) {
        if (!this.enabled) return;
        this.resume();
        if (type === 'health') {
            this.playTone(600, 0.1, 'sine', 0.2);
            setTimeout(() => this.playTone(900, 0.15, 'sine', 0.2), 100);
        } else {
            this.playTone(500, 0.1, 'square', 0.2);
            setTimeout(() => this.playTone(700, 0.1, 'square', 0.2), 80);
        }
    },
    
    headshot() {
        if (!this.enabled) return;
        this.resume();
        this.playTone(800, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(1200, 0.15, 'sine', 0.3), 50);
    },
    
    waveStart() {
        if (!this.enabled) return;
        this.resume();
        [300, 400, 500, 600].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.2, 'sine', 0.25), i * 100);
        });
    },
    
    empty() {
        if (!this.enabled) return;
        this.resume();
        this.playTone(100, 0.05, 'square', 0.2);
    }
};