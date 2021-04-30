const Moonstone = require("../");
const ytdl = require("ytdl-core-discord");
const bot = new Moonstone(require("./auth"));

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);
  const topRooms = await bot.getTopRooms();
  console.log("There are " + topRooms.length + " available rooms.");

  const foundRooms = topRooms.filter(
    (room) => room.creatorId == "ae738cee-f431-4033-b0da-025d44fce6b8" // Filter for rooms created by a specific user
  );

  // If the filter found a room, join it, otherwise create one.
  const room =
    foundRooms.length > 0
      ? foundRooms[0]
      : await bot.createRoom({
          name: "Music Bot",
          description:
            "Powered by Moonstone | https://github.com/fuwwy/moonstone",
          privacy: "public",
        });
  await bot.joinRoom(room); // Join room
});

// Send a message when first joining a room.
bot.on("joinedRoom", async (room) => {
  await room.sendChatMessage("Hi, I'm a music bot :D");
  await room.sendChatMessage("Type !help to see all my commands.");
});

// Send message to users who join the room
bot.on("userJoinRoom", async (user, room) => {
  await user.sendWhisper(
    "Hi, welcome to the room! Type !help to see all my commands."
  );
});

const isPlayingMusic = (room) => {
  return (
    room.audioConnection &&
    room.audioConnection.player &&
    room.audioConnection.player.dispatcher
  );
};

// Listen for chat messages
bot.on("newChatMsg", async (msg) => {
  // Command parser
  if (msg.content.startsWith("!")) {
    const command = msg.content.includes(" ")
      ? msg.content.split(" ")[0]
      : msg.content;
    const args = msg.content.includes(" ")
      ? msg.content.split(" ").slice(1)
      : [];

    switch (command.substring(1)) {
      case "help":
        await msg.user.sendWhisper(
          "Here's a list of commands:\n!play <url> - Play a song from youtube.\n!pause - Pause or resume the player.\n!volume <volume> - Set the player volume (0-2)"
        );
        break;
      case "play":
        if (args.length < 1)
          return await msg.room.sendChatMessage("Invalid url");
        const url = args[0];
        await msg.room.sendChatMessage("Playing " + url + "...");
        playFromUrl(msg.room, url);
        break;
      case "pause":
        if (!isPlayingMusic(msg.room))
          return msg.room.sendChatMessage("Not playing anything.");

        if (!msg.room.audioConnection.player.dispatcher.paused)
          msg.room.audioConnection.player.dispatcher.pause();
        else msg.room.audioConnection.player.dispatcher.resume();

        break;
      case "volume":
        if (!isPlayingMusic(msg.room))
          return msg.room.sendChatMessage("Not playing anything.");

        if (args.length < 1)
          return await msg.room.sendChatMessage("Invalid volume");
        const volume = parseInt(args[0]);
        if (volume > 2 || volume < 0)
          return await msg.room.sendChatMessage("Invalid volume");

        msg.room.audioConnection.player.dispatcher.setVolume(volume); // Set music volume
        break;
      default:
        await msg.room.sendChatMessage("Unknown command.");
        break;
    }
  }
});

const playFromUrl = async (room, url) => {
  if (!room.selfUser.isSpeaker) {
    await room.sendChatMessage(
      "I need to be a speaker in order to play music."
    );
    if (!room.selfUser.roomPermissions.askedToSpeak) await room.askToSpeak();
    return;
  }
  let stream;
  try {
    stream = await ytdl(url);
  } catch (e) {
    await room.sendChatMessage("Failed to get video: " + e.message);
  }
  if (!stream) return;
  const audioConnection = await room.connect(); // Connect to the room voice server (or grab it, if already connected.)
  audioConnection.play(stream, { type: "opus" }); // Play opus stream from youtube.
};

bot.connect();
