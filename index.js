"use strict";

const Client = require("./lib/Moonstone");

function Moonstone(token, options) {
  return new Client(token, options);
}

module.exports = Moonstone;
