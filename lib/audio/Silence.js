const { Readable } = require("stream");

const SILENCE_FRAME = Buffer.alloc(1920);

class Silence extends Readable {
  _read() {
    this.push(SILENCE_FRAME);
  }
}

Silence.SILENCE_FRAME = SILENCE_FRAME;

module.exports = Silence;
