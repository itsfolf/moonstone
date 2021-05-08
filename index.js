"use strict";

const Client = require("./lib/Moonstone");

function Moonstone(token, options) {
  return new Client(token, options);
}

Moonstone.Client = Client;
Moonstone.User = require("./lib/core/User");
Moonstone.Room = require("./lib/core/Room");
Moonstone.ActiveUser = require("./lib/core/ActiveUser");
Moonstone.ActiveRoom = require("./lib/core/ActiveRoom");
Moonstone.Message = require("./lib/core/Message");
Moonstone.Constants = require("./lib/Constants");
Moonstone.VERSION = require("./package.json").version;

module.exports = Moonstone;
