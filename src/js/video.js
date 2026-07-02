window.VideoManager = {
  isLoading: false,
  pollInterval: null,

  init() {
    this.promptEl = document.getElementById('video-prompt');
    this.widthEl = document.getElementById('video-width');
    this.heightEl = document.getElementById('video-height');
    this.framesEl = document.getElementById('video-frames');
    this.fpsEl = document.getElementById('video-fps');
    this.generateBtn = document.getElementById('btn-generate-video');
    this.placeholderEl = document.getElementById('video-placeholder');
    this.loadingEl = document.getElementById('video-loading');
    this.outputEl = document.getElementById('video-output');
    this.errorEl = document.getElementById('video-error');
    this.statusText = document.getElementById('video-status-text');
    this.progressBar = document.getElementById('video-progress-bar');
    this.progressFill = document.getElementById('video-progress-fill');
    this.generatedVideo = document.getElementById('generated-video');
    this.errorText = document.getElementById('video-error-text');

    this.generateBtn.addEventListener('click', () => this.generate());
    document.getElementById('btn-download-video').addEventListener('click', () => this.download());
  },

  async generate() {
    if (this.isLoading) return;

    const prompt = this.promptEl.value.trim();
    if (!prompt) {
      this.promptEl.focus();
      return;
    }

    const apiKey = await ModalManager.requireApiKey();
    if (!apiKey) return;

    const width = parseInt(this.widthEl.value);
    const height = parseInt(this.heightEl.value);
    const frames = parseInt(this.framesEl.value);
    const fps = parseInt(this.fpsEl.value);

    this.showLoading();
    this.isLoading = true;
    this.generateBtn.disabled = true;

    try {
      const videoId = await AppAPI.videoCreate(prompt, height, width, frames, fps);
      this.statusText.textContent = `Video wird generiert... (ID: ${videoId})`;
      this.progressBar.style.display = 'block';
      this.progressFill.style.width = '10%';

      await this.pollForResult(videoId);
    } catch (e) {
      this.showError(e);
    } finally {
      this.isLoading = false;
      this.generateBtn.disabled = false;
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }
  },

  async pollForResult(videoId) {
    let attempts = 0;
    const maxAttempts = 120;

    return new Promise((resolve, reject) => {
      this.pollInterval = setInterval(async () => {
        attempts++;

        try {
          const status = await AppAPI.videoPoll(videoId);

          if (status.status === 'completed' || status.status === 'done') {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            this.progressFill.style.width = '100%';

            if (status.video_url) {
              this.showResult(status.video_url);
              resolve();
            } else {
              this.showError('Video-URL nicht gefunden');
              reject(new Error('Keine Video-URL'));
            }
            return;
          }

          if (status.status === 'failed' || status.status === 'error') {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            this.showError(status.error || 'Video-Generierung fehlgeschlagen');
            reject(new Error(status.error || 'Fehlgeschlagen'));
            return;
          }

          const progress = status.progress || (attempts / maxAttempts * 90);
          this.progressFill.style.width = `${Math.min(progress, 95)}%`;
          this.statusText.textContent = `Video wird generiert... (${status.status || 'warten'})`;

          if (attempts >= maxAttempts) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            this.showError('Zeitüberschreitung bei der Video-Generierung');
            reject(new Error('Timeout'));
          }
        } catch (e) {
          if (attempts >= maxAttempts) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            this.showError(e);
            reject(e);
          }
        }
      }, 5000);
    });
  },

  showLoading() {
    this.placeholderEl.style.display = 'none';
    this.outputEl.style.display = 'none';
    this.errorEl.style.display = 'none';
    this.loadingEl.style.display = 'flex';
    this.statusText.textContent = 'Video wird generiert...';
    this.progressFill.style.width = '0%';
  },

  showResult(url) {
    this.placeholderEl.style.display = 'none';
    this.loadingEl.style.display = 'none';
    this.errorEl.style.display = 'none';
    this.outputEl.style.display = 'flex';
    this.generatedVideo.src = url;
    this.currentVideoUrl = url;
  },

  showError(msg) {
    this.placeholderEl.style.display = 'none';
    this.loadingEl.style.display = 'none';
    this.outputEl.style.display = 'none';
    this.errorEl.style.display = 'flex';
    this.errorText.textContent = typeof msg === 'string' ? msg : 'Unbekannter Fehler';
  },

  async download() {
    if (!this.currentVideoUrl) return;

    try {
      const response = await fetch(this.currentVideoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `agnes-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(this.currentVideoUrl, '_blank');
    }
  }
};
