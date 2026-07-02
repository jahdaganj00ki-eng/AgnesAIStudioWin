window.ModalManager = {
  modal: null,
  input: null,
  statusEl: null,
  isOpen: false,

  init() {
    this.modal = document.getElementById('api-key-modal');
    this.input = document.getElementById('api-key-input');
    this.statusEl = document.getElementById('api-key-status');

    document.getElementById('btn-api-key').addEventListener('click', () => this.open());
    document.getElementById('btn-api-key-welcome').addEventListener('click', () => this.open());
    document.getElementById('btn-close-modal').addEventListener('click', () => this.close());
    document.getElementById('btn-cancel-modal').addEventListener('click', () => this.close());
    document.getElementById('btn-save-api-key').addEventListener('click', () => this.save());
    document.getElementById('btn-toggle-password').addEventListener('click', () => this.togglePassword());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.save();
    });

    this.checkStatus();
  },

  async checkStatus() {
    try {
      const key = await AppAPI.loadApiKey();
      if (key) {
        this.statusEl.classList.add('set');
      } else {
        this.statusEl.classList.remove('set');
      }
    } catch (e) {
      this.statusEl.classList.remove('set');
    }
  },

  open() {
    this.isOpen = true;
    this.modal.style.display = 'flex';
    this.input.value = '';
    this.input.type = 'password';
    setTimeout(() => this.input.focus(), 100);
  },

  close() {
    this.isOpen = false;
    this.modal.style.display = 'none';
    this.input.value = '';
  },

  togglePassword() {
    this.input.type = this.input.type === 'password' ? 'text' : 'password';
  },

  async save() {
    const key = this.input.value.trim();
    if (!key) {
      this.input.style.borderColor = 'var(--danger)';
      setTimeout(() => { this.input.style.borderColor = ''; }, 2000);
      return;
    }

    try {
      await AppAPI.saveApiKey(key);
      this.close();
      await this.checkStatus();
    } catch (e) {
      console.error('Fehler beim Speichern des API-Keys:', e);
    }
  },

  async requireApiKey() {
    const key = await AppAPI.loadApiKey();
    if (!key) {
      this.open();
      return null;
    }
    return key;
  }
};
