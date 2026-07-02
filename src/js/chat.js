window.ChatManager = {
  messages: [],
  isStreaming: false,
  currentConversationId: null,
  chatArea: null,
  chatMessages: null,
  chatWelcome: null,
  chatInput: null,
  sendBtn: null,
  imagePreviewEl: null,
  imagePreviewImg: null,
  attachedImage: null,
  streamUnlisten: null,
  streamDoneUnlisten: null,

  async init() {
    this.chatArea = document.getElementById('chat-area');
    this.chatMessages = document.getElementById('chat-messages');
    this.chatWelcome = document.getElementById('chat-welcome');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('btn-send');
    this.imagePreviewEl = document.getElementById('image-preview');
    this.imagePreviewImg = document.getElementById('image-preview-img');

    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    this.chatInput.addEventListener('input', () => this.autoResize());

    document.getElementById('btn-clear-chat').addEventListener('click', () => this.clearChat());
    document.getElementById('btn-attach-image').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', (e) => this.handleImageUpload(e));
    document.getElementById('btn-remove-image').addEventListener('click', () => this.removeImage());

    document.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.chatInput.value = btn.dataset.prompt;
        this.autoResize();
        this.sendMessage();
      });
    });

    this.setupStreamListeners();

    const convId = SettingsManager.getActiveConversationId();
    if (convId) {
      await this.loadConversation(convId);
    }
  },

  setupStreamListeners() {
    AppAPI.listen('chat-stream-chunk', (chunk) => {
      const lastMsg = this.messages[this.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.content += chunk;
        this.updateLastMessage();
      }
    });

    AppAPI.listen('chat-stream-done', () => {
      this.isStreaming = false;
      this.sendBtn.disabled = false;
      this.chatInput.disabled = false;
      this.saveCurrentConversation();
      this.removeTypingIndicator();
    });
  },

  async loadConversation(id) {
    try {
      const convs = await AppAPI.loadConversations();
      const conv = convs.find(c => c.id === id);
      if (conv) {
        this.currentConversationId = conv.id;
        this.messages = [...conv.messages];
        this.chatWelcome.style.display = 'none';
        this.chatMessages.style.display = 'block';
        this.renderAllMessages();
        AppUtils.scrollToBottom(this.chatArea);
      }
    } catch (e) {
      console.error('Fehler beim Laden der Conversation:', e);
    }
  },

  async sendMessage() {
    if (this.isStreaming) return;

    const content = this.chatInput.value.trim();
    if (!content && !this.attachedImage) return;

    const apiKey = await ModalManager.requireApiKey();
    if (!apiKey) return;

    if (!this.currentConversationId) {
      this.currentConversationId = AppUtils.generateId();
      SettingsManager.setActiveConversation(this.currentConversationId);
    }

    const userMessage = {
      role: 'user',
      content: content,
      image_url: this.attachedImage || null,
    };
    this.messages.push(userMessage);

    this.chatWelcome.style.display = 'none';
    this.chatMessages.style.display = 'block';
    this.renderMessage(userMessage);
    AppUtils.scrollToBottom(this.chatArea);

    this.chatInput.value = '';
    this.autoResize();
    this.removeImage();

    const assistantMessage = { role: 'assistant', content: '' };
    this.messages.push(assistantMessage);
    this.renderMessage(assistantMessage);
    this.showTypingIndicator();

    this.isStreaming = true;
    this.sendBtn.disabled = true;
    this.chatInput.disabled = true;

    try {
      await AppAPI.chatSendStreaming(
        this.messages.slice(0, -1),
        'agnes-2.0-flash',
        SettingsManager.getSystemPrompt(),
        SettingsManager.getTemperature()
      );
    } catch (e) {
      const lastMsg = this.messages[this.messages.length - 1];
      lastMsg.content = `**Fehler:** ${e}`;
      this.updateLastMessage();
      this.isStreaming = false;
      this.sendBtn.disabled = false;
      this.chatInput.disabled = false;
      this.removeTypingIndicator();
    }

    if (SidebarManager) SidebarManager.refreshConversations();
  },

  renderMessage(msg) {
    const div = document.createElement('div');
    div.className = `message message-${msg.role}`;
    div.dataset.role = msg.role;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (msg.role === 'user' && msg.image_url) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'message-image';
      const img = document.createElement('img');
      img.src = msg.image_url;
      imgDiv.appendChild(img);
      bubble.appendChild(imgDiv);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    if (msg.content) {
      contentDiv.innerHTML = AppUtils.markdownToHtml(msg.content);
    }
    bubble.appendChild(contentDiv);

    div.appendChild(bubble);
    this.chatMessages.appendChild(div);
  },

  updateLastMessage() {
    const lastMsg = this.messages[this.messages.length - 1];
    if (!lastMsg) return;

    const lastDiv = this.chatMessages.querySelector('.message:last-child');
    if (!lastDiv) return;

    const contentDiv = lastDiv.querySelector('.message-content');
    if (contentDiv && lastMsg.content) {
      contentDiv.innerHTML = AppUtils.markdownToHtml(lastMsg.content);
    }
    AppUtils.scrollToBottom(this.chatArea);
  },

  showTypingIndicator() {
    const lastBubble = this.chatMessages.querySelector('.message:last-child .message-bubble');
    if (!lastBubble) return;

    const existing = lastBubble.querySelector('.typing-indicator');
    if (existing) return;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    lastBubble.appendChild(indicator);
  },

  removeTypingIndicator() {
    document.querySelectorAll('.typing-indicator').forEach(el => el.remove());
  },

  renderAllMessages() {
    this.chatMessages.innerHTML = '';
    this.messages.forEach(msg => this.renderMessage(msg));
  },

  autoResize() {
    const el = this.chatInput;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  },

  async handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    try {
      const base64 = await AppUtils.fileToBase64(file);
      this.attachedImage = base64;
      this.imagePreviewImg.src = base64;
      this.imagePreviewEl.style.display = 'inline-block';
    } catch (err) {
      console.error('Fehler beim Laden des Bildes:', err);
    }

    e.target.value = '';
  },

  removeImage() {
    this.attachedImage = null;
    this.imagePreviewEl.style.display = 'none';
    this.imagePreviewImg.src = '';
  },

  async clearChat() {
    if (this.isStreaming) return;

    this.messages = [];
    this.currentConversationId = null;
    SettingsManager.setActiveConversation(null);

    if (this.currentConversationId) {
      try {
        await AppAPI.deleteConversation(this.currentConversationId);
      } catch (e) {}
    }

    this.chatMessages.innerHTML = '';
    this.chatMessages.style.display = 'none';
    this.chatWelcome.style.display = 'flex';

    if (SidebarManager) SidebarManager.refreshConversations();
  },

  async saveCurrentConversation() {
    if (!this.currentConversationId || this.messages.length === 0) return;

    const title = this.messages[0]?.content || 'Neuer Chat';
    const conversation = {
      id: this.currentConversationId,
      title: AppUtils.truncate(title, 50),
      messages: this.messages,
      created_at: AppUtils.formatTimestamp(),
      system_prompt: SettingsManager.getSystemPrompt(),
      temperature: SettingsManager.getTemperature(),
    };

    try {
      await AppAPI.saveConversation(conversation);
    } catch (e) {
      console.error('Fehler beim Speichern:', e);
    }
  }
};
