## Node-telegram-random-message-replier

[![Build Status](https://travis-ci.org/maratfakhreev/node-telegram-random-message-replier.svg?branch=master)](https://travis-ci.org/maratfakhreev/node-telegram-random-message-replier)

Node module which allows the bot to reply to a random message in the chat.

You just set the probability between 1 and 100 and then the magic happens.

### Install:

```bash
npm install node-telegram-random-message-replier
```

### Use:

node-telegram-random-message-replier initially works with [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api).

```javascript
const TelegramBot = require('node-telegram-bot-api');
const TelegramRandomMessageReplier = require('node-telegram-random-message-replier');

// initialize
const bot = new TelegramBot(BOT_TOKEN);
const replier = new TelegramRandomMessageReplier({
  bot,
  defaultChance: 0,
  showChanceMessage: 'Current chance is CURRENT_CHANCE%',
  setChanceMessage: 'Current chance changed from CURRENT_CHANCE% to NEXT_CHANCE%'
  // CURRENT_CHANCE and NEXT_CHANCE strings will be replaced with currentChance and nextChance values
});

// on command "/chance" will show current chance value
bot.onText(/^\/chance($|@)/, msg => {
  replier.showChance(msg);
});

// on command "/setchance 30" will set chance value to 30% to reply to the message
// command "/setchance" without value is equal to "/chance". So you can use only one command in your bot
bot.onText(/^\/chance(@.* )?(.+)?/, (msg, match) => {
  const chanceValue = match[2];

  replier.setChance(msg, chanceValue);
});

// handle each message to be ready for replying
bot.on('message', msg => {
  const chatId = msg.chat.id;
  // try() method calculates chance for message of being replied
  // the chance is set previously via "/setchance <value>" command
  replier.try(msg).then(msg => {
    // do something with lucky message
    bot.sendMessage(chatId, msg);
  }).catch(msg => {
    // do something with unlucky message if you want
  });
});
```

### Options:

```javascript
new TelegramCacheChatMessages({
  bot: <your bot instance> // previously created bot via node-telegram-bot-api
  defaultChance: <number> // default chance to reply to a message | default: 0
  showChanceMessage: <string> // set message for show chance command
  setChanceMessage: <string> // set message for change chance command
});
```
