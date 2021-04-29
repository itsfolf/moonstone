"use strict";

const MoonstoneClient = require("./lib/Moonstone");

function Moonstone(token, options) {
  return new MoonstoneClient(token, options);
}

module.exports = Moonstone;
