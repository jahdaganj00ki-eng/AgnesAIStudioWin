window.AppManager = {
  activeTab: 'chat',

  async init() {
    await SettingsManager.init();
    ModalManager.init();
    ChatManager.init();
    ImageManager.init();
    VideoManager.init();
    await SidebarManager.init();

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchTab(item.dataset.tab);
      });
    });

    this.updateSettingsVisibility();
  },

  switchTab(tab) {
    this.activeTab = tab;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.toggle('active', el.id === `tab-${tab}`);
    });

    this.updateSettingsVisibility();
  },

  updateSettingsVisibility() {
    const settingsPanel = document.getElementById('settings-panel');
    settingsPanel.style.display = this.activeTab === 'chat' ? 'flex' : 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppManager.init();
});
