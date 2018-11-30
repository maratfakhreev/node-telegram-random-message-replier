const { random, remove, unionWith } = require('lodash');
const firebase = require('firebase-admin');
const serviceAccount = require('./serviceKey.json');

class TelegramRandomMessageReplier {
  constructor(options) {
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount),
      databaseURL: 'https://betweenlegsbot.firebaseio.com'
    });

    // this.bot = options.bot;
    // this.defaultChance = options.defaultChance || 0;
    // this.showChanceMessage = options.showChanceMessage || 'Current chance is CURRENT_CHANCE%';
    // this.setChanceMessage = options.setChanceMessage || 'Current chance changed from CURRENT_CHANCE% to NEXT_CHANCE%';
    this.storage = firebase.firestore().collection('chats');

    this.pushChat({ chatId: 111 });
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

  try(msg, callback) {
    const chatId = msg.chat.id;
    const currentChatIndex = this.getChatIndex(chatId);

    return new Promise((resolve, reject) => {
      if (currentChatIndex > -1) {
        const randomNumber = random(1, 100);
        const chanceNumber = this.getChat(currentChatIndex).chance;

        if (randomNumber <= chanceNumber) return resolve(msg);

        return reject(msg);
      }

      return reject(msg);
    });
  }

  handleMessage(msg, currentChance = null, nextChance = null) {
    const cc = /CURRENT_CHANCE/g;
    const nc = /NEXT_CHANCE/g;
    let newMsg = msg;

    if (currentChance !== null) newMsg = newMsg.replace(cc, currentChance);
    if (nextChance !== null) newMsg = newMsg.replace(nc, nextChance);

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

  async getChats() {
    let chats = [];
    const snapshot = await this.storage.get();

    snapshot.forEach(doc => {
      chats = [...chats, doc.data()];
    });

    return chats || [];
  }

  // setChats(chat) {
  //   this.storage.add(chat);
  // }

  getChat(index) {
    return this.getChats()[index];
  }

  async getChatIndex(chatId) {
    const chats = await this.getChats();
    const chat = chats.filter(chat => chat.chatId === chatId)[0];

    return chats.indexOf(chat);
  }

  // async removeChat(chatId) {
  //   const chats = await this.getChats();

  //   remove(chats, item => item.chatId === chatId);
  //   this.setChats(chats);
  // }

  // async pushChat(chat) {
  //   this.storage.add(chat);
  //   // const chats = await this.getChats();
  //   // const unionChats = unionWith([data], chats, (a, b) => a.chatId === b.chatId);

  //   // this.setChats(unionChats);
  // }
}

new TelegramRandomMessageReplier();
