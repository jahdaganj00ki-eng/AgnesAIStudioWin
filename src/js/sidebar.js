window.SidebarManager = {
  conversations: [],

  async init() {
    this.container = document.getElementById('conversations-items');
    document.getElementById('btn-new-chat').addEventListener('click', () => this.newChat());
    await this.refreshConversations();
  },

  async refreshConversations() {
    try {
      this.conversations = await AppAPI.loadConversations();
      this.renderConversations();
    } catch (e) {
      console.error('Fehler beim Laden der Conversations:', e);
    }
  },

  renderConversations() {
    this.container.innerHTML = '';

    const activeId = SettingsManager.getActiveConversationId();

    this.conversations.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'conversation-item' + (conv.id === activeId ? ' active' : '');

      const title = document.createElement('span');
      title.className = 'conversation-item-title';
      title.textContent = conv.title || 'Neuer Chat';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'conversation-item-delete';
      deleteBtn.innerHTML = '✕';
      deleteBtn.title = 'Löschen';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteConversation(conv.id);
      });

      item.appendChild(title);
      item.appendChild(deleteBtn);

      item.addEventListener('click', () => this.selectConversation(conv.id));

      this.container.appendChild(item);
    });
  },

  async selectConversation(id) {
    SettingsManager.setActiveConversation(id);
    await ChatManager.loadConversation(id);
    this.renderConversations();
    AppManager.switchTab('chat');
  },

  async deleteConversation(id) {
    try {
      await AppAPI.deleteConversation(id);

      if (SettingsManager.getActiveConversationId() === id) {
        SettingsManager.setActiveConversation(null);
        ChatManager.currentConversationId = null;
        ChatManager.messages = [];
        ChatManager.chatMessages.innerHTML = '';
        ChatManager.chatMessages.style.display = 'none';
        ChatManager.chatWelcome.style.display = 'flex';
      }

      await this.refreshConversations();
    } catch (e) {
      console.error('Fehler beim Löschen:', e);
    }
  },

  async newChat() {
    SettingsManager.setActiveConversation(null);
    ChatManager.currentConversationId = null;
    ChatManager.messages = [];
    ChatManager.chatMessages.innerHTML = '';
    ChatManager.chatMessages.style.display = 'none';
    ChatManager.chatWelcome.style.display = 'flex';
    this.renderConversations();
    AppManager.switchTab('chat');
  }
};
