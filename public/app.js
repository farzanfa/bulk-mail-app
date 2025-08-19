class MedicalTranscriptionApp {
    constructor() {
        this.audioProcessor = new AudioProcessor();
        this.isRecording = false;
        this.transcriptionHistory = [];
        
        // DOM elements
        this.recordButton = null;
        this.transcriptionOutput = null;
        this.statusMessage = null;
        this.historyList = null;
        
        this.initializeUI();
    }

    initializeUI() {
        // Create main container
        const container = document.createElement('div');
        container.className = 'medical-transcription-app';
        container.innerHTML = `
            <div class="app-header">
                <h1>Medical Transcription Assistant</h1>
                <p class="subtitle">AI-powered medical dictation and transcription</p>
            </div>
            
            <div class="recording-section">
                <button id="recordButton" class="record-button">
                    <span class="record-icon">🎤</span>
                    <span class="button-text">Start Recording</span>
                </button>
                <div id="statusMessage" class="status-message"></div>
            </div>
            
            <div class="transcription-section">
                <h2>Current Transcription</h2>
                <div id="transcriptionOutput" class="transcription-output">
                    <p class="placeholder">Click "Start Recording" to begin transcribing...</p>
                </div>
            </div>
            
            <div class="history-section">
                <h2>Transcription History</h2>
                <ul id="historyList" class="history-list">
                    <li class="placeholder">No transcriptions yet</li>
                </ul>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Get DOM references
        this.recordButton = document.getElementById('recordButton');
        this.transcriptionOutput = document.getElementById('transcriptionOutput');
        this.statusMessage = document.getElementById('statusMessage');
        this.historyList = document.getElementById('historyList');
        
        // Add event listeners
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        
        // Add styles
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f5f7fa;
                color: #333;
                line-height: 1.6;
            }
            
            .medical-transcription-app {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .app-header {
                text-align: center;
                margin-bottom: 40px;
                padding: 30px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .app-header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            
            .subtitle {
                font-size: 1.1em;
                opacity: 0.9;
            }
            
            .recording-section {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .record-button {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 20px 40px;
                font-size: 18px;
                border-radius: 50px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
            }
            
            .record-button:hover {
                background-color: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
            }
            
            .record-button.recording {
                background-color: #f44336;
                animation: pulse 1.5s infinite;
            }
            
            .record-button.recording:hover {
                background-color: #da190b;
            }
            
            @keyframes pulse {
                0% {
                    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
                }
                50% {
                    box-shadow: 0 4px 25px rgba(244, 67, 54, 0.6);
                }
                100% {
                    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
                }
            }
            
            .record-icon {
                font-size: 24px;
            }
            
            .status-message {
                margin-top: 20px;
                font-size: 14px;
                color: #666;
                min-height: 20px;
            }
            
            .transcription-section, .history-section {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                margin-bottom: 30px;
            }
            
            .transcription-section h2, .history-section h2 {
                color: #333;
                margin-bottom: 20px;
                font-size: 1.5em;
            }
            
            .transcription-output {
                min-height: 150px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border: 1px solid #e9ecef;
            }
            
            .transcription-output .placeholder {
                color: #999;
                font-style: italic;
            }
            
            .history-list {
                list-style: none;
            }
            
            .history-list .placeholder {
                color: #999;
                font-style: italic;
                padding: 10px;
            }
            
            .history-item {
                padding: 15px;
                margin-bottom: 10px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border: 1px solid #e9ecef;
                transition: all 0.2s ease;
            }
            
            .history-item:hover {
                background-color: #e9ecef;
            }
            
            .history-item-time {
                font-size: 12px;
                color: #666;
                margin-bottom: 5px;
            }
            
            .history-item-text {
                color: #333;
            }
            
            .error-message {
                color: #f44336;
                background-color: #ffebee;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            await this.stopRecording();
        }
    }

    async startRecording() {
        try {
            // Initialize audio processor if not already done
            if (!this.audioProcessor.audioContext) {
                this.updateStatus('Requesting microphone access...');
                await this.audioProcessor.initialize();
            }
            
            // Start recording
            this.audioProcessor.startRecording();
            this.isRecording = true;
            
            // Update UI
            this.recordButton.classList.add('recording');
            this.recordButton.querySelector('.button-text').textContent = 'Stop Recording';
            this.updateStatus('Recording in progress...');
            
            // Clear current transcription
            this.transcriptionOutput.innerHTML = '<p>Listening...</p>';
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async stopRecording() {
        try {
            // Stop recording
            const audioBlob = await this.audioProcessor.stopRecording();
            this.isRecording = false;
            
            // Update UI
            this.recordButton.classList.remove('recording');
            this.recordButton.querySelector('.button-text').textContent = 'Start Recording';
            this.updateStatus('Processing audio...');
            
            // Process the audio
            if (audioBlob) {
                await this.processAudio(audioBlob);
            }
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async processAudio(audioBlob) {
        try {
            // For now, we'll simulate transcription since we need a backend API
            // In a real application, you would send the audio to a transcription service
            this.updateStatus('Transcribing audio...');
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simulated transcription result
            const transcription = this.generateSimulatedTranscription();
            
            // Display transcription
            this.displayTranscription(transcription);
            
            // Add to history
            this.addToHistory(transcription);
            
            this.updateStatus('Transcription complete');
            
        } catch (error) {
            this.showError('Failed to transcribe audio: ' + error.message);
        }
    }

    generateSimulatedTranscription() {
        const medicalPhrases = [
            "Patient presents with mild hypertension, blood pressure 140/90.",
            "Prescribed 10mg lisinopril once daily, follow up in 4 weeks.",
            "Physical examination reveals normal heart sounds, no murmurs.",
            "Patient reports occasional headaches, no chest pain or shortness of breath.",
            "Laboratory results show normal kidney function, creatinine 0.9.",
            "Advised lifestyle modifications including low sodium diet and regular exercise.",
            "No signs of peripheral edema, lungs clear to auscultation bilaterally.",
            "Patient history includes type 2 diabetes, well controlled on metformin."
        ];
        
        // Return 1-3 random phrases
        const count = Math.floor(Math.random() * 3) + 1;
        const selected = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * medicalPhrases.length);
            selected.push(medicalPhrases[randomIndex]);
        }
        
        return selected.join(' ');
    }

    displayTranscription(text) {
        this.transcriptionOutput.innerHTML = `<p>${text}</p>`;
    }

    addToHistory(text) {
        const timestamp = new Date().toLocaleString();
        const historyItem = {
            text: text,
            timestamp: timestamp
        };
        
        this.transcriptionHistory.unshift(historyItem);
        
        // Keep only last 10 transcriptions
        if (this.transcriptionHistory.length > 10) {
            this.transcriptionHistory.pop();
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.transcriptionHistory.length === 0) {
            this.historyList.innerHTML = '<li class="placeholder">No transcriptions yet</li>';
            return;
        }
        
        this.historyList.innerHTML = this.transcriptionHistory
            .map(item => `
                <li class="history-item">
                    <div class="history-item-time">${item.timestamp}</div>
                    <div class="history-item-text">${item.text}</div>
                </li>
            `)
            .join('');
    }

    updateStatus(message) {
        this.statusMessage.textContent = message;
    }

    showError(message) {
        this.statusMessage.innerHTML = `<div class="error-message">${message}</div>`;
        this.isRecording = false;
        this.recordButton.classList.remove('recording');
        this.recordButton.querySelector('.button-text').textContent = 'Start Recording';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MedicalTranscriptionApp();
});