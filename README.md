Moonstone [![NPM version](https://img.shields.io/npm/v/moonstone-wrapper.svg?style=flat-square&color=informational)](https://npmjs.com/package/moonstone-wrapper)
====

A simple dogehouse.tv API wrapper

Ping Pong Example
-----------------

```js
const Moonstone = require("moonstone-wrapper");

var bot = new Moonstone("TOKEN"); // Replace TOKEN with your bot account's token

bot.on("ready", async () => { // When the bot is ready
  console.log(`Ready! Logged in as ${bot.user.username}`); // Log "Ready!"
  const topRooms = await bot.getTopRooms(); // Grab the top rooms
  bot.joinRoom(topRooms[0]); // Join the top room
});

bot.on("newChatMsg", (msg) => { // When a message is created
  if (msg.content === "!ping") { // If the message content is "!ping"
    msg.room.sendChatMessage("Pong!"); // Send a message in the same channel with "Pong!"
  } else if (msg.content === "!pong") { // Otherwise, if the message is "!pong"
    msg.user.sendWhisper("Ping!"); // Whisper to the user with "Ping!"
  }
});

bot.connect(); // Get the bot to connect to Dogehouse
```
