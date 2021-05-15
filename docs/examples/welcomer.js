
/**
 * A bot that welcomes new room members when they join.
 */

// Import moonstone
const Moonstone = require("moonstone-wrapper");

// Create an instance of a Moonstone client
var bot = Moonstone("BOT_TOKEN");

bot.on("ready", async (user) => {
  // Log to the console the username that was logged in as.
  console.log("Ready! Logged in as " + user.username);

  // Grab the current Dogehouse top rooms.
  const topRooms = await bot.getTopRooms();
  // Join the first one in the list
  await bot.joinRoom(topRooms[0]); 
});

bot.on("userJoinRoom", async (user, room) => {
  // Send a whisper to the user, welcoming them to the room.
  await user.sendWhisper("Hi, welcome to " + room.name + "!");
});

// Connect the bot to Dogehouse
bot.connect(); 
