const Moonstone = require("../");

var bot = new Moonstone(require("./auth"));

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);
  const topRooms = await bot.getTopRooms(); // Grab the top rooms
  bot.joinRoom(topRooms[0]); // Join the top room
});

bot.on("userJoinRoom", async (user, room) => {
  await user.sendWhisper("Hi, welcome to " + room.name + "!"); // Send a whisper
});

bot.connect(); // Connect the bot to Dogehouse
