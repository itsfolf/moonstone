const Moonstone = require("../");
const ytdl = require("ytdl-core-discord");
const bot = new Moonstone(require("./auth"));

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);
  const topRooms = await bot.getTopRooms();
  console.log("There are " + topRooms.length + " available rooms.");

  const foundRooms = topRooms.filter(
    (room) => room.creatorId == "ae738cee-f431-4033-b0da-025d44fce6b8"
  );

  const room =
    foundRooms.length > 0
      ? foundRooms[0]
      : await bot.createRoom({
          name: "Music Bot",
          description:
            "Powered by Moonstone | https://github.com/fuwwy/moonstone",
          privacy: "public",
        });
  await bot.joinRoom(room);
});

bot.on("joinedRoom", async (room) => {
  await room.sendChatMessage("Hi, I'm a music bot :D");
  await room.sendChatMessage("Type !help to see all my commands.");
});

bot.on("userJoinRoom", async (user, room) => {
  await user.sendWhisper(
    "Hi, welcome to the room! Type !help to see all my commands."
  );
});

bot.on("newChatMsg", async (msg) => {
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
        if (
          msg.room.audioConnection &&
          msg.room.audioConnection.player &&
          msg.room.audioConnection.player.dispatcher
        )
          if (!msg.room.audioConnection.player.dispatcher.paused)
            msg.room.audioConnection.player.dispatcher.pause();
          else msg.room.audioConnection.player.dispatcher.resume();
        else msg.room.sendChatMessage("Not playing anything.");
        break;
      case "volume":
        if (args.length < 1)
          return await msg.room.sendChatMessage("Invalid volume");
        const volume = parseInt(args[0]);
        if (volume > 2 || volume < 0)
          return await msg.room.sendChatMessage("Invalid volume");
        if (
          !msg.room.audioConnection ||
          !msg.room.audioConnection.player ||
          !msg.room.audioConnection.player.dispatcher
        )
          return msg.room.sendChatMessage("Not playing anything.");
        msg.room.audioConnection.player.dispatcher.setVolume(volume);
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
    return;
  }
  if (!stream) return;
  const audioConnection = await room.connect();
  audioConnection.play(stream, { type: "opus" });
};

bot.connect();
