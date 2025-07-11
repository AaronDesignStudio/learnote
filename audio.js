class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.compressor = null;
        this.init();
    }

    init() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.2;
            
            // Create compressor
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
            
            // Connect nodes
            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }

    noteToFrequency(note) {
        // Convert note name to frequency
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const noteName = note.slice(0, -1);
        
        const noteIndex = notes.indexOf(noteName);
        if (noteIndex === -1) return 0;
        
        // Calculate semitones from A4
        const a4Position = 9 + 4 * 12; // A4 position
        const notePosition = noteIndex + octave * 12;
        const semitonesFromA4 = notePosition - a4Position;
        
        // Calculate frequency
        return 440 * Math.pow(2, semitonesFromA4 / 12);
    }

    playNote(note, duration = 0.3) {
        if (!this.audioContext) return;
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const frequency = this.noteToFrequency(note);
        if (frequency === 0) return;
        
        const now = this.audioContext.currentTime;
        
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;
        
        // Create gain envelope
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0;
        
        // Create filter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = frequency * 4;
        filter.Q.value = 1;
        
        // Connect nodes
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.compressor);
        
        // Apply envelope
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.1); // Decay
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release
        
        // Start and stop
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
}

// Export for use in other files
const audioEngine = new AudioEngine();