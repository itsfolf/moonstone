const { Readable: ReadableStream, Transform } = require("stream");
const prism = require("prism-media");
const AudioDispatcher = require("./AudioDispatcher");
const FFMPEG_ARGUMENTS = [
  "-analyzeduration",
  "0",
  "-loglevel",
  "0",
  "-f",
  "s16le",
  "-ar",
  "48000",
  "-ac",
  "2",
];

class AudioPlayer {
  constructor(audioConnection) {
    this.audioConnection = audioConnection;
    this.dispatcher = null;
  }

  destroy() {
    this.destroyDispatcher();
  }

  destroyDispatcher() {
    if (this.dispatcher) {
      this.dispatcher.destroy();
      this.dispatcher = null;
    }
  }

  playUnknown(input, options) {
    this.destroyDispatcher();

    const isStream = input instanceof ReadableStream;

    const args = isStream
      ? FFMPEG_ARGUMENTS.slice()
      : ["-i", input, ...FFMPEG_ARGUMENTS];
    if (options.seek) args.unshift("-ss", String(options.seek));

    const ffmpeg = new prism.FFmpeg({ args });
    const streams = { ffmpeg };
    if (isStream) {
      streams.input = input;
      input.pipe(ffmpeg);
    }
    return this.playPCMStream(ffmpeg, options, streams);
  }

  playOpusStream(stream, options, streams = {}) {
    this.destroyDispatcher();
    const opusDecoder = (streams.opus = new prism.opus.Decoder({
      channels: 2,
      rate: 48000,
      frameSize: 960,
    }));
    stream.pipe(opusDecoder);
    return this.playPCMStream(opusDecoder, options, streams);
  }

  playPCMStream(stream, options, streams = {}) {
    this.destroyDispatcher();
    streams.pcm = stream;
    if (options.volume !== false && !streams.input) {
      streams.input = stream;
      streams.volume = new prism.VolumeTransformer({
        type: "s16le",
        volume: options ? options.volume : 1,
      });
      streams.pcm = stream.pipe(streams.volume);
    }
    const dispatcher = this.createDispatcher(options, streams);
    streams.splitter = new AudioStreamSplitter();
    streams.pcm.pipe(streams.splitter).pipe(dispatcher);
    return dispatcher;
  }

  createDispatcher(options, streams, broadcast) {
    this.destroyDispatcher();
    const dispatcher = (this.dispatcher = new AudioDispatcher(
      this,
      options,
      streams,
      broadcast
    ));
    return dispatcher;
  }
}

class AudioStreamSplitter extends Transform {
  // WebRTC uses 10ms audio samples, while Youtube (and most stuff) uses 20ms samples.
  _transform(chunk, encoding, done) {
    if (chunk.byteLength == 3840) {
      var a = Buffer.alloc(1920);
      var b = Buffer.alloc(1920);
      chunk.copy(a, 0, 0, 1920);
      chunk.copy(b, 0, 1920, 1920 * 2);
      this.push(a);
      this.push(b);
    } else {
      this.push(chunk);
    }
    return done();
  }
}
module.exports = AudioPlayer;
