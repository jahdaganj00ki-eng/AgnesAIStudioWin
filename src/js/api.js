window.AppAPI = {
  async invoke(command, args = {}) {
    try {
      return await window.__TAURI__.core.invoke(command, args);
    } catch (err) {
      console.error(`Tauri invoke error (${command}):`, err);
      throw typeof err === 'string' ? err : err.message || String(err);
    }
  },

  async loadApiKey() {
    return await this.invoke('load_api_key');
  },

  async saveApiKey(key) {
    return await this.invoke('save_api_key', { key });
  },

  async loadSettings() {
    return await this.invoke('load_settings');
  },

  async saveSettings(settings) {
    return await this.invoke('save_settings', { settings });
  },

  async loadConversations() {
    return await this.invoke('load_conversations');
  },

  async saveConversation(conversation) {
    return await this.invoke('save_conversation', { conversation });
  },

  async deleteConversation(id) {
    return await this.invoke('delete_conversation', { id });
  },

  async deleteAllConversations() {
    return await this.invoke('delete_all_conversations');
  },

  async chatSendStreaming(messages, model, systemPrompt, temperature) {
    const apiKey = await this.loadApiKey();
    if (!apiKey) throw new Error('API-Key nicht gesetzt');

    return await this.invoke('chat_send_streaming', {
      apiKey,
      messages,
      model,
      systemPrompt,
      temperature,
    });
  },

  async imageGenerate(prompt, model, size) {
    const apiKey = await this.loadApiKey();
    if (!apiKey) throw new Error('API-Key nicht gesetzt');

    return await this.invoke('image_generate', {
      apiKey,
      prompt,
      model,
      size,
    });
  },

  async videoCreate(prompt, height, width, numFrames, frameRate) {
    const apiKey = await this.loadApiKey();
    if (!apiKey) throw new Error('API-Key nicht gesetzt');

    return await this.invoke('video_create', {
      apiKey,
      prompt,
      height,
      width,
      numFrames,
      frameRate,
    });
  },

  async videoPoll(videoId) {
    const apiKey = await this.loadApiKey();
    if (!apiKey) throw new Error('API-Key nicht gesetzt');

    return await this.invoke('video_poll', {
      apiKey,
      videoId,
    });
  },

  listen(event, callback) {
    return window.__TAURI__.event.listen(event, (e) => {
      callback(e.payload);
    });
  }
};
