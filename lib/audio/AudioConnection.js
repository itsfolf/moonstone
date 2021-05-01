const wrtc = require("wrtc");
for (name in wrtc) global[name] = wrtc[name];
global["navigator"] = {
  userAgent: "Chrome/74.0.3729.108",
};

const { Readable } = require("stream");
const EventEmitter = require("events").EventEmitter;
const Device = require("mediasoup-client").Device;
const device = new Device();
const { RTCAudioSource } = require("wrtc").nonstandard;
const AudioPlayer = require("./AudioPlayer");
const AudioDispatcher = require("./AudioDispatcher");

/**
 * Represents an audio connection
 * @extends EventEmitter
 * @prop {AudioPlayer?} player The current audio player
 */
class AudioConnection extends EventEmitter {
  constructor(client, options = {}) {
    super();
    this._client = client;
    this.options = options;
  }

  disconnect() {
    if (this.player) this.player.destroy();
    if (this.sendTransport) this.sendTransport.close();
    this.player = null;
    this.sendTransport = null;
  }

  async connect() {
    if (!device.loaded)
      await device.load({
        routerRtpCapabilities: this.options.routerRtpCapabilities,
      });
    if (!this.sendTransport || this.sendTransport.closed) {
      await this._connectInput();
      this.player = new AudioPlayer(this);
    }
  }

  /**
   * Play an audio resource.
   * @param {ReadableStream|string} resource The resource to play
   * @param {StreamOptions} [options] The options to play.
   * @example
   * // Play a local audio file
   * connection.play('/home/hydrabolt/audio.mp3', { volume: 0.5 });
   * @example
   * // Play a ReadableStream
   * connection.play(ytdl('https://www.youtube.com/watch?v=ZlAU_w7-Xp8', { quality: 'highestaudio' }));
   * @example
   * // Play a voice broadcast
   * const broadcast = client.voice.createBroadcast();
   * broadcast.play('/home/hydrabolt/audio.mp3');
   * connection.play(broadcast);
   * @example
   * // Using different protocols: https://ffmpeg.org/ffmpeg-protocols.html
   * connection.play('http://www.sample-videos.com/audio/mp3/wave.mp3');
   * @returns {AudioDispatcher}
   */
  play(resource, options = {}) {
    if (resource instanceof Readable || typeof resource === "string") {
      const type = options.type || "unknown";
      if (type === "unknown") {
        return this.player.playUnknown(resource, options);
      } else if (type === "converted") {
        return this.player.playPCMStream(resource, options);
      } else if (type === "opus") {
        return this.player.playOpusStream(resource, options);
      } else if (type === "ogg/opus") {
        if (!(resource instanceof Readable))
          throw new Error("VOICE_PRISM_DEMUXERS_NEED_STREAM");
        return this.player.playOpusStream(
          resource.pipe(new prism.opus.OggDemuxer()),
          options
        );
      } else if (type === "webm/opus") {
        if (!(resource instanceof Readable))
          throw new Error("VOICE_PRISM_DEMUXERS_NEED_STREAM");
        return this.player.playOpusStream(
          resource.pipe(new prism.opus.WebmDemuxer()),
          options
        );
      }
    }
    throw new Error("VOICE_PLAY_INTERFACE_BAD_TYPE");
  }

  /**
   * Set the client speaking state
   * @param {Boolean} speaking
   */
  async setSpeaking(speaking) {
    await this._client.setSpeaking(speaking);
  }

  async _connectInput() {
    this.sendTransport = device.createSendTransport(
      this.options.sendTransportOptions
    );
    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, resolve, reject) => {
        this._client.once("@connect-transport-send-done", (data) => {
          if ("error" in data) {
            console.log(data.error);
            reject();
          } else {
            resolve();
          }
        });

        this._client.sendWS("@connect-transport", {
          transportId: this.sendTransport.id,
          direction: "send",
          dtlsParameters,
        });
      }
    );

    this.sendTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, resolve, reject) => {
        this._client.once("@send-track-send-done", (data) => {
          if ("error" in data) {
            console.log(data.error);
            reject();
          } else {
            resolve(data);
          }
        });

        this._client.sendWS("@send-track", {
          transportId: this.options.sendTransportOptions.id,
          direction: "send",
          rtpParameters,
          rtpCapabilities: device.rtpCapabilities,
          paused: false,
          kind,
          appData,
        });
      }
    );

    this.audioSource = new RTCAudioSource();
    await this.sendTransport.produce({
      track: this.audioSource.createTrack(),
      appData: { mediaTag: "cam-audio" },
    });
  }
}

module.exports = AudioConnection;
