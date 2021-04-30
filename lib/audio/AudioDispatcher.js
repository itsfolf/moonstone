"use strict";

const { Writable } = require("stream");
const Silence = require("./Silence");
const VolumeInterface = require("./VolumeInterface");

const FRAME_LENGTH = 10;

class AudioDispatcher extends Writable {
  constructor(
    player,
    { seek = 0, volume = 1, highWaterMark = 12 } = {},
    streams
  ) {
    const streamOptions = { seek, volume, highWaterMark };
    super(streamOptions);
    /**
     * The Audio Player that controls this dispatcher
     * @type {AudioPlayer}
     */
    this.player = player;
    this.streamOptions = streamOptions;
    this.streams = streams;
    this.streams.silence = new Silence();

    this._nonce = 0;
    this._nonceBuffer = Buffer.alloc(24);

    this.lastSpeakPacket = null;

    /**
     * The time that the stream was paused at (null if not paused)
     * @type {?number}
     */
    this.pausedSince = null;
    this._writeCallback = null;

    this._pausedTime = 0;
    this._silentPausedTime = 0;
    this.count = 0;

    this.on("finish", () => {
      this._cleanup();
      this._setSpeaking(false);
    });

    this.setVolume(volume);

    const streamError = (type, err) => {
      if (type && err) {
        err.message = `${type} stream: ${err.message}`;
        this.emit(this.player.dispatcher === this ? "error" : "debug", err);
      }
      this.destroy();
    };

    this.on("error", () => streamError());
    if (this.streams.input)
      this.streams.input.on("error", (err) => streamError("input", err));
    if (this.streams.ffmpeg)
      this.streams.ffmpeg.on("error", (err) => streamError("ffmpeg", err));
    if (this.streams.opus)
      this.streams.opus.on("error", (err) => streamError("opus", err));
    if (this.streams.pcm)
      this.streams.pcm.on("error", (err) => streamError("pcm", err));
    if (this.streams.splitter)
      this.streams.splitter.on("error", (err) => streamError("splitter", err));
    if (this.streams.volume)
      this.streams.volume.on("error", (err) => streamError("volume", err));
  }

  _write(chunk, enc, done) {
    if (!this.startTime) {
      /**
       * Emitted once the stream has started to play.
       * @event StreamDispatcher#start
       */
      this.emit("start");
      this.startTime = Date.now();
    }
    this._playChunk(chunk);
    this._step(done);
  }

  _destroy(err, cb) {
    this._cleanup();
    super._destroy(err, cb);
  }

  _cleanup() {
    if (this.player.dispatcher === this) this.player.dispatcher = null;
    const { streams } = this;
    if (streams.opus) streams.opus.destroy();
    if (streams.pcm) streams.pcm.destroy();
    if (streams.splitter) streams.splitter.destroy();
    if (streams.ffmpeg) streams.ffmpeg.destroy();
  }

  /**
   * Pauses playback
   * @param {boolean} [silence=false] Whether to play silence while paused to prevent audio glitches
   */
  pause(silence = false) {
    if (this.paused) return;
    if (this.streams.splitter) this.streams.splitter.unpipe(this);
    if (silence) {
      this.streams.silence.pipe(this);
      this._silence = true;
    } else {
      this._setSpeaking(false);
    }
    this.pausedSince = Date.now();
  }

  /**
   * Whether or not playback is paused
   * @type {boolean}
   * @readonly
   */
  get paused() {
    return Boolean(this.pausedSince);
  }

  /**
   * Total time that this dispatcher has been paused in milliseconds
   * @type {number}
   * @readonly
   */
  get pausedTime() {
    return (
      this._silentPausedTime +
      this._pausedTime +
      (this.paused ? Date.now() - this.pausedSince : 0)
    );
  }

  /**
   * Resumes playback
   */
  resume() {
    if (!this.pausedSince) return;
    this.streams.silence.unpipe(this);
    if (this.streams.splitter) this.streams.splitter.pipe(this);
    if (this._silence) {
      this._silentPausedTime += Date.now() - this.pausedSince;
      this._silence = false;
    } else {
      this._pausedTime += Date.now() - this.pausedSince;
    }
    this.pausedSince = null;
    if (typeof this._writeCallback === "function") this._writeCallback();
  }

  /**
   * The time (in milliseconds) that the dispatcher has actually been playing audio for
   * @type {number}
   * @readonly
   */
  get streamTime() {
    return this.count * FRAME_LENGTH;
  }

  /**
   * The time (in milliseconds) that the dispatcher has been playing audio for, taking into account skips and pauses
   * @type {number}
   * @readonly
   */
  get totalStreamTime() {
    return Date.now() - this.startTime;
  }

  _step(done) {
    this._writeCallback = () => {
      this._writeCallback = null;
      done();
    };
    if (!this.streams.broadcast) {
      const next =
        FRAME_LENGTH +
        this.count * FRAME_LENGTH -
        (Date.now() - this.startTime - this._pausedTime);
      setTimeout(() => {
        if ((!this.pausedSince || this._silence) && this._writeCallback)
          this._writeCallback();
      }, next);
    }
    this.count++;
  }

  _final(callback) {
    this._writeCallback = null;
    callback();
  }

  _playChunk(chunk) {
    if (
      this.player.dispatcher !== this ||
      !this.player.audioConnection.audioSource
    )
      return;

    if (!this.lastSpeakPacket || Date.now() - this.lastSpeakPacket > 5000) {
      this._setSpeaking(true);
      this.lastSpeakPacket = Date.now();
    }

    this.player.audioConnection.audioSource.onData({
      samples: chunk,
      sampleRate: 48000,
      bitsPerSample: 16,
      channelCount: 2,
      numberOfFrames: 48000 / 100,
    });
  }

  _setSpeaking(value) {
    if (typeof this.player.audioConnection !== "undefined") {
      this.player.audioConnection.setSpeaking(value);
    }
    this.emit("speaking", value);
  }

  get volumeEditable() {
    return Boolean(this.streams.volume);
  }

  // Volume
  get volume() {
    return this.streams.volume ? this.streams.volume.volume : 1;
  }

  setVolume(value) {
    if (!this.streams.volume) return false;
    /**
     * Emitted when the volume of this dispatcher changes.
     * @event StreamDispatcher#volumeChange
     * @param {number} oldVolume The old volume of this dispatcher
     * @param {number} newVolume The new volume of this dispatcher
     */
    this.emit("volumeChange", this.volume, value);
    this.streams.volume.setVolume(value);
    return true;
  }

  // Volume stubs for docs
  /* eslint-disable no-empty-function*/
  get volumeDecibels() {}
  get volumeLogarithmic() {}
  setVolumeDecibels() {}
  setVolumeLogarithmic() {}
}

VolumeInterface.applyToClass(AudioDispatcher);

module.exports = AudioDispatcher;
