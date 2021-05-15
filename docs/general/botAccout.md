## How to create a bot account

- First, you're gonna need to instatiate the client using your personal account tokens.
  ```js
  const Moonstone = require("moonstone-wrapper");
  const bot = Moonstone({
    accessToken: "TOKEN",
    refreshToken: "REFRESH_TOKEN"
  });
  ```

  Replace TOKEN with your token and REFRESH_TOKEN with your refresh token from [dogehouse.tv](dogehouse.tv). If you don't know how to get your tokens, then check [How to get your tokens](http://moonstone.folf.party/#/main/main/general/tokens).

- Next, we'll create a ready listener, and call [createBotAccount](https://moonstone.folf.party/#/main/main/class/Moonstone?scrollTo=createBotAccount) with our new bot username. Lastly, we'll tell the bot to connect to Dogehouse.

  ```js
  bot.on("ready", async (user) => {
    console.log("Ready! Logged in as " + user.username);

    const botAccountData = await bot.createBotAccount("BOT_USERNAME");
    console.log(botAccountData);
  });

  bot.connect(); // Connect the bot to Dogehouse
  ```

- Finally, just run your file (`node file.js`), and your token (or creation error) should be printed out to the console.