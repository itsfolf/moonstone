// This is a file I use for debugging, do not include in the docs.
const Moonstone = require("../..");

// {refreshToken: ..., accessToken: ...}
const bot = Moonstone(require("./auth"), { logUnhandledPackets: true });

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);
  const topRooms = await bot.getTopRooms();
  console.log("There are " + topRooms.length + " available rooms.");

  const activeRoom = await bot.joinRoom(
    topRooms.filter((room) => room.name.includes("stuffy"))[0]
  );
});

bot.on("joinedRoom", (room) =>
  console.log(
    "Joined room " +
      room.name +
      " by " +
      room.users.get(room.creatorId).username
  )
);

bot.on("leftRoom", (room, wasKicked) => {
  console.log((wasKicked ? "was kicked from" : "left") + " room " + room.name);
});

bot.on("joinedAsPeer", async (room) => {
  console.log("Joined as peer.");
  room.askToSpeak();
});

bot.on("handRaised", (user, room) => {
  console.log(user.username + " is raising their hand.");
});
bot.on("speakerAdded", (user, room) => {
  console.log(user.username + " is now a speaker");
});
bot.on("speakerRemoved", (user, room) => {
  console.log(user.username + " is no longer a speaker.");
  if (user.id == bot.user.id) room.askToSpeak();
});

bot.on("userLeftRoom", (user, room) => {
  console.log(
    "User left room",
    user.username,
    bot.currentRoom.users.map((user) => user.username).join(", ")
  );
});

bot.on("userJoinRoom", (user, room) => {
  console.log(
    "User joined room",
    user.username,
    bot.currentRoom.users.map((user) => user.username).join(", ")
  );
});

bot.on("activeSpeakerChange", (user, room) =>
  console.log(
    user.username +
      " is " +
      (user.voiceState.speaking ? "now" : "no longer") +
      " speaking."
  )
);

bot.on("muteChange", (user, room) =>
  console.log(
    user.username +
      " is " +
      (user.voiceState.muted ? "now" : "no longer") +
      " muted."
  )
);

bot.on("deafenChange", (user, room) =>
  console.log(
    user.username +
      " is " +
      (user.voiceState.deafened ? "now" : "no longer") +
      " deafened."
  )
);

bot.on("newChatMsg", (msg) => {
  if (msg.content.startsWith("!ping")) {
    const prebuiltMessage = bot.buildChatMessage((builder) =>
      builder.text("Prebuilt").emoji("doughdoge")
    );
    msg.room.sendChatMessage(({ text }) => text("Pong!").mention(msg.user));
    msg.room.sendChatMessage((builder) =>
      builder.text("a").emoji("CoolHouse").mention(msg.user).text("pog")
    );
    msg.user.sendWhisper(prebuiltMessage);
    msg.room.sendChatMessage("Pong!" + msg.content.substring(5));
    msg.user.sendWhisper("Pong!" + msg.content.substring(5));
  } else if (msg.content == "!pause") {
    if (msg.room.audioConnection) {
      const dispatcher = msg.room.audioConnection.player.dispatcher;
      if (!dispatcher.pausedSince) dispatcher.pause();
      else dispatcher.resume();
    }
  }
  console.log(
    "New chat message from " + msg.user.username + ": " + msg.content
  );
});

bot.on("msgDeleted", (msgId, deleter) => {
  console.log(msgId + " was deleted by " + deleter.username);
});

bot.on("joinedAsSpeaker", async (room) => {
  console.log("Joined as speaker.");
  const voiceConnection = await room.connect();
  const ytdl = require("ytdl-core-discord");
  const dispatcher = voiceConnection.play(
    await ytdl("https://www.youtube.com/watch?v=3MQZ-aQt7Ac"),
    {
      type: "opus",
    }
  );
  dispatcher.on("finish", () => {
    console.log("Finished playing.");
  });
  dispatcher.setVolume(1.2);
});

bot.on("becameSpeaker", (room) => {
  console.log("Became speaker");
});

bot.on("newTokens", (tokens) => console.log("Got new tokens", tokens));

bot.on("modChanged", (user, room) => {
  console.log(
    user.username +
      (user.roomPermissions.isMod ? " became " : " is no longer ") +
      "a mod"
  );
});

bot.on("warn", (msg) => console.log("Warn", msg));
bot.on("error", (msg) => console.log("Error", msg));
bot.on("debug", (msg) => console.log("Debug", msg));
//bot.on("rawWS", (msg) => console.log("-->", JSON.stringify(msg, undefined, 3)));
bot.connect();
