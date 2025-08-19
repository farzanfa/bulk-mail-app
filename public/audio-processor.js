class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
    }

    async initialize() {
        try {
            // Initialize Web Audio API context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio processor:', error);
            throw new Error('Failed to access microphone. Please ensure microphone permissions are granted.');
        }
    }

    startRecording(onDataAvailable) {
        if (!this.stream) {
            throw new Error('Audio processor not initialized. Call initialize() first.');
        }

        this.audioChunks = [];
        
        // Create MediaRecorder with the stream
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: 'audio/webm'
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
                if (onDataAvailable) {
                    onDataAvailable(event.data);
                }
            }
        };

        this.mediaRecorder.start(1000); // Collect data every second
        this.isRecording = true;
    }

    stopRecording() {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.audioChunks = [];
                this.isRecording = false;
                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    async getAudioBuffer(blob) {
        const arrayBuffer = await blob.arrayBuffer();
        return await this.audioContext.decodeAudioData(arrayBuffer);
    }

    getRecordingState() {
        return this.isRecording;
    }

    cleanup() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}