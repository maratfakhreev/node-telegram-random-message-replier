const { JSONStorage } = require('node-localstorage');
const { random, remove, unionWith } = require('lodash');

module.exports = class TelegramRandomMessageReplier {
  constructor(options) {
    this.storage = new JSONStorage(options.dbPath || '/tmp/storage');
    this.bot = options.bot;
    this.defaultChance = options.defaultChance || 0;
    this.showChanceMessage = options.showChanceMessage || 'Current chance is CURRENT_CHANCE%';
    this.setChanceMessage = options.setChanceMessage || 'Current chance changed from CURRENT_CHANCE% to NEXT_CHANCE%';
  }

  showChance(msg) {
    const chatId = msg.chat.id;
    const currentChance = this.getCurrentChance(chatId);

    this.bot.sendMessage(chatId, this.handleMessage(this.showChanceMessage, currentChance));
  }

  setChance(msg, value) {
    const chatId = msg.chat.id;
    const chance = parseInt(value);

    if (isNaN(chance)) {
      const currentChance = this.getCurrentChance(chatId);

      return this.bot.sendMessage(chatId, this.handleMessage(this.showChanceMessage, currentChance));
    }

    this.saveChance(chatId, chance);
  }

  process(msg, successCb, errorCb = () => {}) {
    const chatId = msg.chat.id;
    const currentChatIndex = this.getChatIndex(chatId);

    if (!successCb || typeof successCb !== 'function') {
      throw new Error('Specify success callback that handles replied message as second parameter of process function');
    }

    if (currentChatIndex > -1) {
      if (random(1, 100) <= this.getChat(currentChatIndex).chance) {
        successCb(msg);
      } else {
        errorCb(msg);
      }
    } else {
      errorCb(msg);
    }
  }

  handleMessage(msg, currentChance = null, nextChance = null) {
    let newMsg = msg;

    if (currentChance !== null) newMsg = newMsg.replace(/CURRENT_CHANCE/g, currentChance);
    if (nextChance !== null) newMsg = newMsg.replace(/NEXT_CHANCE/g, nextChance);

    return newMsg;
  }

  saveChance(chatId, nextChance) {
    if (nextChance > 100) nextChance = 100;

    const currentChance = this.getCurrentChance(chatId);

    this.bot.sendMessage(chatId, this.handleMessage(this.setChanceMessage, currentChance, nextChance));

    if (nextChance === 0) {
      this.removeChat(chatId);
    } else {
      this.pushChat({ chatId, chance: nextChance });
    }
  }

  getCurrentChance(chatId) {
    const currentChatIndex = this.getChatIndex(chatId);

    return currentChatIndex > -1 ?
      this.getChat(currentChatIndex).chance :
      this.defaultChance;
  }

  getChats() {
    return this.storage.getItem('chats') || [];
  }

  setChats(chats) {
    this.storage.setItem('chats', chats);
  }

  getChat(index) {
    return this.getChats()[index];
  }

  getChatIndex(chatId) {
    const chats = this.getChats();
    const chat = chats.filter(chat => chat.chatId === chatId)[0];

    return chats.indexOf(chat);
  }

  removeChat(chatId) {
    const chats = this.getChats();

    remove(chats, item => item.chatId === chatId);
    this.setChats(chats);
  }

  pushChat(data) {
    const chats = this.getChats();
    const unionChats = unionWith([data], chats, (a, b) => a.chatId === b.chatId);

    this.setChats(unionChats);
  }
};
