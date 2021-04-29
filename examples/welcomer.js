const Moonstone = require("../");

var bot = new Moonstone(require("./auth"));

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);
  console.log(
    "There are " + (await bot.getTopRooms()).rooms.length + " available rooms."
  );
});

bot.connect();
