class NoteRecognitionGame {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.currentNote = null;
        this.isWaitingForAnswer = true;
        this.incorrectAttempts = 0;
        
        this.notes = [
            'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
            'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
            'C6'
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateNewNote();
    }
    
    setupEventListeners() {
        const pianoKeys = document.querySelectorAll('.key');
        pianoKeys.forEach(key => {
            key.addEventListener('click', (e) => this.handleKeyClick(e));
        });
        
        document.getElementById('nextButton').addEventListener('click', () => {
            this.generateNewNote();
        });
    }
    
    generateNewNote() {
        this.clearFeedback();
        this.clearNotation();
        this.removeHints();
        this.isWaitingForAnswer = true;
        this.incorrectAttempts = 0;
        document.getElementById('nextButton').disabled = true;
        
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
            // C4 (middle C) = C
            // C5 = c
            // C6 = c'
            // C3 = C,
            if (octave === 3) {
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
            document.getElementById('nextButton').disabled = false;
            
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
        const currentNoteWithoutOctave = this.currentNote.replace(/\d/, '');
        const clickedNoteWithoutOctave = clickedNote.replace(/\d/, '');
        
        return currentNoteWithoutOctave === clickedNoteWithoutOctave;
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
        // Find all keys that match the current note (any octave)
        const currentNoteWithoutOctave = this.currentNote.replace(/\d/, '');
        const matchingKeys = document.querySelectorAll('.key');
        
        matchingKeys.forEach(key => {
            const keyNote = key.dataset.note;
            if (keyNote && keyNote.replace(/\d/, '') === currentNoteWithoutOctave) {
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