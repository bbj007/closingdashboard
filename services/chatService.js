const fs = require('fs');
const path = require('path');

class MockChatAdapter {
  async fetchMessages() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/chat-messages.json'))); }
  normalizeMessages(raw) { return raw; }
  filterClosingRelatedMessages(messages) { return messages.filter(m => /(결산|마감|오류|지연|I\/F|전표)/i.test(m.text)); }
  groupMessagesByThread(messages) { return messages.reduce((a, m) => ((a[m.threadId] ||= []).push(m), a), {}); }
  extractParticipants(messages) { return [...new Set(messages.map(m => m.senderName))]; }
}

function createChatService() {
  const adapter = new MockChatAdapter();
  return {
    async fetchAndPrepareMessages(params) {
      const raw = await adapter.fetchMessages(params);
      const norm = adapter.normalizeMessages(raw);
      return adapter.filterClosingRelatedMessages(norm, params.closingMonth);
    }
  };
}
module.exports = { createChatService };
