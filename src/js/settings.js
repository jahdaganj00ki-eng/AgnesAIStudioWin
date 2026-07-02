window.SettingsManager = {
  settings: null,

  async init() {
    try {
      this.settings = await AppAPI.loadSettings();
    } catch (e) {
      this.settings = {
        system_prompt: 'Du bist ein hilfreicher, präziser KI-Assistent.',
        temperature: 0.7,
        last_model: 'agnes-2.0-flash',
        active_conversation_id: null,
      };
    }

    this.systemPromptEl = document.getElementById('system-prompt');
    this.temperatureEl = document.getElementById('temperature');
    this.temperatureValueEl = document.getElementById('temperature-value');

    this.systemPromptEl.value = this.settings.system_prompt;
    this.temperatureEl.value = this.settings.temperature;
    this.temperatureValueEl.textContent = this.settings.temperature.toFixed(1);

    this.systemPromptEl.addEventListener('input', () => this.onSettingsChange());
    this.temperatureEl.addEventListener('input', () => {
      this.settings.temperature = parseFloat(this.temperatureEl.value);
      this.temperatureValueEl.textContent = this.settings.temperature.toFixed(1);
      this.onSettingsChange();
    });
  },

  getSystemPrompt() {
    return this.systemPromptEl.value.trim();
  },

  getTemperature() {
    return this.settings.temperature;
  },

  getActiveConversationId() {
    return this.settings.active_conversation_id;
  },

  setActiveConversation(id) {
    this.settings.active_conversation_id = id;
    this.saveSettings();
  },

  async onSettingsChange() {
    this.settings.system_prompt = this.systemPromptEl.value;
    this.settings.temperature = parseFloat(this.temperatureEl.value);
    await this.saveSettings();
  },

  async saveSettings() {
    try {
      await AppAPI.saveSettings(this.settings);
    } catch (e) {
      console.error('Fehler beim Speichern der Einstellungen:', e);
    }
  }
};
