window.ImageManager = {
  isLoading: false,

  init() {
    this.promptEl = document.getElementById('image-prompt');
    this.modelEl = document.getElementById('image-model');
    this.sizeEl = document.getElementById('image-size');
    this.generateBtn = document.getElementById('btn-generate-image');
    this.placeholderEl = document.getElementById('image-placeholder');
    this.loadingEl = document.getElementById('image-loading');
    this.outputEl = document.getElementById('image-output');
    this.errorEl = document.getElementById('image-error');
    this.generatedImg = document.getElementById('generated-image');
    this.errorText = document.getElementById('image-error-text');

    this.generateBtn.addEventListener('click', () => this.generate());

    document.getElementById('btn-download-image').addEventListener('click', () => this.download());
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

    const model = this.modelEl.value;
    const size = this.sizeEl.value;

    this.showLoading();
    this.isLoading = true;
    this.generateBtn.disabled = true;

    try {
      const url = await AppAPI.imageGenerate(prompt, model, size);
      this.showResult(url);
    } catch (e) {
      this.showError(e);
    } finally {
      this.isLoading = false;
      this.generateBtn.disabled = false;
    }
  },

  showLoading() {
    this.placeholderEl.style.display = 'none';
    this.outputEl.style.display = 'none';
    this.errorEl.style.display = 'none';
    this.loadingEl.style.display = 'flex';
  },

  showResult(url) {
    this.placeholderEl.style.display = 'none';
    this.loadingEl.style.display = 'none';
    this.errorEl.style.display = 'none';
    this.outputEl.style.display = 'flex';
    this.generatedImg.src = url;
    this.currentImageUrl = url;
  },

  showError(msg) {
    this.placeholderEl.style.display = 'none';
    this.loadingEl.style.display = 'none';
    this.outputEl.style.display = 'none';
    this.errorEl.style.display = 'flex';
    this.errorText.textContent = typeof msg === 'string' ? msg : 'Unbekannter Fehler';
  },

  async download() {
    if (!this.currentImageUrl) return;

    try {
      const response = await fetch(this.currentImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `agnes-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(this.currentImageUrl, '_blank');
    }
  }
};
