const Moonstone = require("../");

var bot = Moonstone({
  accessToken: "...",
  refreshToken: "...",
});

bot.on("ready", async (user) => {
  console.log("Ready! Logged in as " + user.username);

  const botAccountData = await bot.createBotAccount("testbotusername");
  console.log(botAccountData);
});

bot.connect(); // Connect the bot to Dogehouse
