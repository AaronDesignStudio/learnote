class NoteRecognitionGame {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.currentNote = null;
        this.isWaitingForAnswer = true;
        this.incorrectAttempts = 0;
        
        // All available notes including sharps
        this.allNotes = [
            // Octave 2
            'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
            // Octave 3
            'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
            // Octave 4 (Middle C)
            'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
            // Octave 5
            'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
            // C6
            'C6'
        ];
        
        // Natural notes only (no sharps)
        this.naturalNotes = this.allNotes.filter(note => !note.includes('#'));
        
        // Active notes for practice (filtered based on user selection)
        this.notes = [...this.naturalNotes];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateRange(); // Initialize with default range
        this.generateNewNote();
    }
    
    setupEventListeners() {
        const pianoKeys = document.querySelectorAll('.key');
        pianoKeys.forEach(key => {
            key.addEventListener('click', (e) => this.handleKeyClick(e));
        });
        
        // Range selector event listeners
        document.getElementById('startNote').addEventListener('change', () => this.updateRange());
        document.getElementById('endNote').addEventListener('change', () => this.updateRange());
        document.getElementById('includeSharps').addEventListener('change', () => this.updateRange());
        
    }
    
    generateNewNote() {
        this.clearFeedback();
        this.clearNotation();
        this.removeHints();
        this.isWaitingForAnswer = true;
        this.incorrectAttempts = 0;
        
        const randomIndex = Math.floor(Math.random() * this.notes.length);
        this.currentNote = this.notes[randomIndex];
        
        this.displayNote(this.currentNote);
    }
    
    displayNote(note) {
        const div = document.getElementById('notation');
        div.innerHTML = '';
        
        try {
            // Check if ABCJS is loaded
            if (typeof ABCJS === 'undefined') {
                console.error('ABCJS library not loaded');
                div.innerHTML = '<p style="color: red;">Music notation library not loaded</p>';
                return;
            }
            
            // Convert note format from "C4" to ABC notation
            // ABC notation uses lowercase for higher octaves and uppercase for lower
            const hasSharp = note.includes('#');
            const noteBase = note.charAt(0);
            const octave = parseInt(note.charAt(note.length - 1));
            
            let abcNote = noteBase;
            
            // In ABC notation:
            // C2 = C,, (two octaves below middle C)
            // C3 = C, (one octave below middle C)
            // C4 (middle C) = C
            // C5 = c (one octave above middle C)
            // C6 = c' (two octaves above middle C)
            if (octave === 2) {
                abcNote = abcNote.toUpperCase() + ',,';
            } else if (octave === 3) {
                abcNote = abcNote.toUpperCase() + ',';
            } else if (octave === 4) {
                abcNote = abcNote.toUpperCase();
            } else if (octave === 5) {
                abcNote = abcNote.toLowerCase();
            } else if (octave === 6) {
                abcNote = abcNote.toLowerCase() + "'";
            }
            
            // Add sharp if needed
            if (hasSharp) {
                abcNote = '^' + abcNote;
            }
            
            // Create ABC notation string with minimal staff
            const abcNotation = `X:1
L:1/4
K:C clef=treble
${abcNote}4`;
            
            console.log('Displaying note:', note, 'as ABC:', abcNote);
            
            // Create a wrapper div for better centering
            const wrapper = document.createElement('div');
            wrapper.style.width = 'fit-content';
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'center';
            wrapper.style.background = '#ffffff';
            wrapper.style.borderRadius = '10px';
            wrapper.style.padding = '30px 40px';
            wrapper.style.margin = '0 auto';
            div.appendChild(wrapper);
            
            // Render the notation
            ABCJS.renderAbc(wrapper, abcNotation, {
                scale: 1.5,
                staffwidth: 180,
                paddingright: 10,
                paddingleft: 10,
                paddingtop: 10,
                paddingbottom: 10,
                add_classes: true,
                foregroundColor: "#000000",
                backgroundColor: "#ffffff",
                viewportHorizontal: false
            });
            
        } catch (error) {
            console.error('Error displaying note:', error);
            console.error('Note being displayed:', note);
            div.innerHTML = '<p style="color: red;">Error loading music notation</p>';
        }
    }
    
    handleKeyClick(event) {
        if (!this.isWaitingForAnswer) return;
        
        const clickedNote = event.target.dataset.note;
        const isCorrect = this.checkAnswer(clickedNote);
        
        // Play appropriate sound based on correctness
        if (typeof audioEngine !== 'undefined') {
            if (isCorrect) {
                audioEngine.playNote(clickedNote);
            } else {
                audioEngine.playError();
            }
        }
        
        this.highlightKey(event.target, isCorrect);
        this.showFeedback(isCorrect);
        
        if (isCorrect) {
            this.updateScore(true);
            this.isWaitingForAnswer = false;
            
            // Auto advance to next note if correct
            setTimeout(() => {
                this.generateNewNote();
            }, 1000);
        } else {
            // Wrong answer - increment attempts and check if we need to show hint
            this.incorrectAttempts++;
            this.updateScore(false);
            
            // Show hint after 2 incorrect attempts
            if (this.incorrectAttempts >= 2) {
                setTimeout(() => {
                    this.showHint();
                }, 500);
            }
            
            // Keep waiting for the correct answer
            this.isWaitingForAnswer = true;
        }
    }
    
    checkAnswer(clickedNote) {
        // Require exact match including octave
        return clickedNote === this.currentNote;
    }
    
    highlightKey(keyElement, isCorrect) {
        const allKeys = document.querySelectorAll('.key');
        allKeys.forEach(key => {
            key.classList.remove('correct', 'incorrect', 'shake', 'pulse');
        });
        
        if (isCorrect) {
            keyElement.classList.add('correct', 'pulse');
        } else {
            keyElement.classList.add('incorrect', 'shake');
        }
        
        setTimeout(() => {
            keyElement.classList.remove('correct', 'incorrect', 'shake', 'pulse');
        }, 1000);
    }
    
    showFeedback(isCorrect) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = isCorrect ? 'Correct! 🎵' : 'Try again! ❌';
        feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
    }
    
    updateScore(isCorrect) {
        if (isCorrect) {
            this.score++;
            this.streak++;
        } else {
            this.streak = 0;
        }
        
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
    }
    
    clearFeedback() {
        const feedback = document.getElementById('feedback');
        feedback.textContent = '';
        feedback.className = 'feedback';
    }
    
    clearNotation() {
        const allKeys = document.querySelectorAll('.key');
        allKeys.forEach(key => {
            key.classList.remove('correct', 'incorrect');
        });
    }
    
    showHint() {
        // Find the exact key that matches the current note (including octave)
        const matchingKeys = document.querySelectorAll('.key');
        
        matchingKeys.forEach(key => {
            const keyNote = key.dataset.note;
            if (keyNote === this.currentNote) {
                key.classList.add('hint');
            }
        });
    }
    
    removeHints() {
        const allKeys = document.querySelectorAll('.key');
        allKeys.forEach(key => {
            key.classList.remove('hint');
        });
    }
    
    updateRange() {
        const startNote = document.getElementById('startNote').value;
        const endNote = document.getElementById('endNote').value;
        const includeSharps = document.getElementById('includeSharps').checked;
        
        // Get the octave numbers
        const startOctave = parseInt(startNote.slice(-1));
        const endOctave = parseInt(endNote.slice(-1));
        
        // Validate range
        if (startOctave > endOctave) {
            alert('Start note must be lower than or equal to end note');
            // Reset to valid values
            document.getElementById('startNote').value = 'C4';
            document.getElementById('endNote').value = 'C5';
            return;
        }
        
        // Get all notes to use (natural or including sharps)
        const availableNotes = includeSharps ? this.allNotes : this.naturalNotes;
        
        // Filter notes within the selected range
        this.notes = availableNotes.filter(note => {
            const noteOctave = parseInt(note.slice(-1));
            const noteName = note.slice(0, -1);
            const endNoteName = endNote.slice(0, -1);
            
            // Handle exact octave boundaries
            if (noteOctave === startOctave && noteOctave === endOctave) {
                // Both start and end in same octave
                const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const startIndex = noteOrder.indexOf(startNote.slice(0, -1));
                const endIndex = noteOrder.indexOf(endNoteName);
                const noteIndex = noteOrder.indexOf(noteName);
                return noteIndex >= startIndex && noteIndex <= endIndex;
            } else if (noteOctave === startOctave) {
                // In start octave - from start note to B
                return true;
            } else if (noteOctave === endOctave) {
                // In end octave - only up to the end note
                if (endNoteName === 'C') {
                    return noteName === 'C';
                }
                const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const endIndex = noteOrder.indexOf(endNoteName);
                const noteIndex = noteOrder.indexOf(noteName);
                return noteIndex >= 0 && noteIndex <= endIndex;
            } else {
                // In between octaves
                return noteOctave > startOctave && noteOctave < endOctave;
            }
        });
        
        // If we have an active game, generate a new note with the updated range
        if (this.currentNote) {
            this.generateNewNote();
        }
    }
}

window.addEventListener('load', () => {
    // Double-check ABCJS is loaded
    if (typeof ABCJS === 'undefined') {
        console.error('ABCJS is not available. Game cannot start.');
        document.getElementById('notation').innerHTML = '<p style="color: red;">Failed to load music notation library. Please refresh the page.</p>';
        return;
    }
    console.log('ABCJS loaded successfully');
    new NoteRecognitionGame();
});