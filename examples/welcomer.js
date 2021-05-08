const Moonstone = require("../");
const Constants = Moonstone.Constants;

var bot = Moonstone(require("./auth"));

const ownerId = "ae738cee-f431-4033-b0da-025d44fce6b8";

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);
  const topRooms = await bot.getTopRooms(); // Grab the top rooms
  bot.joinRoom(topRooms[0]); // Join the top room
});

bot.on("userJoinRoom", async (user, room) => {
  await user.sendWhisper("Hi, welcome to " + room.name + "!"); // Send a whisper
  // If the user is the bot owner, set them as moderator
  if (user.id == ownerId) await user.setAuthLevel(Constants.AuthLevel.MOD);
});

bot.connect(); // Connect the bot to Dogehouse
