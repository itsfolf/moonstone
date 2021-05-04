Moonstone [![NPM version](https://img.shields.io/npm/v/moonstone-wrapper.svg?style=flat-square&color=informational)](https://npmjs.com/package/moonstone-wrapper)
====

A simple dogehouse.tv API wrapper

<!-- GETTING STARTED -->
## Getting Started

This is an example of how you can setup your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
  ```sh
  npm install npm@latest -g
  ```
  
* yarn
```sh
yarn install npm@latest -g
```

### Installation

1. Get a free API Key at [https://api.dogehouse.tv/bot/auth](https://api.dogehouse.tv/bot/auth)
2. 
3. Install NPM packages
   ```sh
   npm install
   ```

<!-- USAGE EXAMPLES -->
## Usage

You can use the example from below to see how you can use moonstone.

Ping Pong Example
-----------------

```js
const Moonstone = require("moonstone-wrapper");

var bot = Moonstone("TOKEN"); // Replace TOKEN with your bot account's token

bot.on("ready", async () => { // When the bot is ready
  console.log(`Ready! Logged in as ${bot.user.username}`); // Log "Ready!"
  const topRooms = await bot.getTopRooms(); // Grab the top rooms
  bot.joinRoom(topRooms[0]); // Join the top room
});

bot.on("newChatMsg", (msg) => { // When a message is created
  if (msg.content === "!ping") { // If the message content is "!ping"
    msg.room.sendChatMessage("Pong!"); // Send a message in the same channel with "Pong!"
  } else if (msg.content === "!pong") { // Otherwise, if the message is "!pong"
    msg.user.sendWhisper("Ping!"); // Whisper to the user with "Ping!"
  }
});

bot.connect(); // Get the bot to connect to Dogehouse
```

More examples can be found in [the examples folder](https://github.com/fuwwy/moonstone/tree/main/examples).
 - [Welcomer Example](https://github.com/fuwwy/moonstone/blob/main/examples/welcomer.js)
 - [Music Example](https://github.com/fuwwy/moonstone/blob/main/examples/music.js)



<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/othneildrew/Best-README-Template/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.
