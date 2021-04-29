const Moonstone = require("../");

// {refreshToken: ..., accessToken: ...}
var bot = new Moonstone(require("./auth"), { logUnhandledPackets: true });

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);
  const topRooms = await bot.getTopRooms();
  console.log("There are " + topRooms.length + " available rooms.");

  const activeRoom = await bot.joinRoom(topRooms[0]);
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
  //await activeRoom.askToSpeak();
});

bot.on("handRaised", (user, room) => {
  console.log(user.username + " is raising their hand.");
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
      (user.speaking ? "now" : "no longer") +
      " speaking."
  )
);

bot.on("muteChange", (user, room) =>
  console.log(
    user.username + " is " + (user.speaking ? "now" : "no longer") + " muted."
  )
);

bot.on("deafenChange", (user, room) =>
  console.log(
    user.username +
      " is " +
      (user.speaking ? "now" : "no longer") +
      " deafened."
  )
);

bot.on("newChatMsg", (msg, author, room) => {
  console.log(
    "New chat message from " + author.username + ": " + msg.tokens.length
  );
});

bot.on("newTokens", (tokens) => console.log("Got new tokens", tokens));

bot.on("warn", (msg) => console.log("Warn", msg));
bot.on("error", (msg) => console.log("Error", msg));
bot.on("debug", (msg) => console.log("Debug", msg));
//bot.on("rawWS", (msg) => console.log("-->", JSON.stringify(msg, undefined, 3)));
bot.connect();
