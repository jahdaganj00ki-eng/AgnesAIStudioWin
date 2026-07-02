window.AppUtils = {
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatTimestamp() {
    return new Date().toISOString();
  },

  truncate(str, maxLen = 50) {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + '...';
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  markdownToHtml(text) {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, lang) {
          if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(code, { language: lang }).value;
            } catch (e) {}
          }
          return code;
        }
      });
      return marked.parse(text);
    }
    return text.replace(/\n/g, '<br>');
  },

  scrollToBottom(el) {
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
