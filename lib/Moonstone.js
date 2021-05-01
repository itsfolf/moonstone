const EventEmitter = require("events").EventEmitter;
const WebSocket = require("ws");
const OPCodes = require("./Constants").OPCodes;
const uuid = require("uuid").v4;
const https = require("https");

const Collection = require("./utils/Collection");
const Room = require("./core/Room");
const ActiveRoom = require("./core/ActiveRoom");
const ActiveUser = require("./core/ActiveUser");
const Message = require("./core/Message");

/**
 * Represents the main Moonstone client
 * @extends EventEmitter
 * @prop {Object} options Moonhouse options
 * @prop {Collection<Room>} rooms All known rooms
 * @prop {String} token The auth token data
 * @prop {User} user The bot user
 */
class Moonstone extends EventEmitter {
  /**
   * Create an instance of Moonstone
   * @param {String | Object} token
   * @param {Object} [options] Moonstone options
   * @param {String} [options.socketUrl] The dogehouse socket url
   * @param {Boolean} [options.autoReconnect] Whether moonstone should auto reconnect automatically
   * @param {Number} [options.connectionTimeout] How long in milliesconds to wait for an answer from the server
   * @param {Number} [options.callbackTimeout] How long in milliesconds to wait for a fetch reply from the server.
   * @param {Boolean} [options.logUnhandledPackets] Log packets that aren't handled by the event listener (debug).
   */
  constructor(token, options = {}) {
    super();
    if (!token) {
      throw new Error("Token not specified");
    }

    if (typeof token === "string") {
      this.token = { token };
    } else this.token = token;
    this.options = {
      socketUrl: "wss://api.dogehouse.tv/socket",
      autoReconnect: true,
      connectionTimeout: 30000,
      callbackTimeout: 2000,
      logUnhandledPackets: false,
    };
    Object.keys(options).forEach((key) => (this.options[key] = options[key]));

    this.callbacks = [];
    this.callbackTimeouts = [];
    this.voiceDataCache = {};

    this.rooms = new Collection(Room);

    this.hardReset();
  }

  /**
   *  Attempts to connect to Dogehouse
   */
  connect() {
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
      this.emit("error", new Error("Existing connection detected"));
    }
    this.connectAttempts++;
    this.connecting = true;

    if (this.token.token) {
      const inst = this;
      const req = https.request(
        {
          host: "api.dogehouse.tv",
          path: "/bot/auth",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        (response) => {
          var str = "";
          response.on("data", (chunk) => (str += chunk));

          response.on("end", function () {
            try {
              const response = JSON.parse(str);
              if (response.error) throw new Error(response.error);
              inst.token.accessToken = response.accessToken;
              inst.token.refreshToken = response.refreshToken;
              inst.initWS();
            } catch (err) {
              throw new Error("Failed to get bot token: " + str);
            }
          });
        }
      );
      req.write(JSON.stringify({ apiKey: this.token.token }));
      req.end();
    } else this.initWS();

    setTimeout(() => {
      if (this.connecting) {
        this.disconnect(
          {
            reconnect: "auto",
          },
          new Error("Connection timeout")
        );
      }
    }, this.options.connectionTimeout);
  }

  initWS() {
    this.ws = new WebSocket(this.options.socketUrl);
    this.ws.on("open", () => this.auth());
    this.ws.on("message", (m) => {
      if (m === "pong") {
        this.lastPingAck = true;
        return;
      }
      var packet = JSON.parse(m);
      if (this.listenerCount("rawWS") > 0) {
        this.emit("rawWS", packet);
      }
      this.wsEvent(packet);
    });
    this.ws.on("error", (err, msg) => {
      if (msg) this.emit("debug", "WS error: " + msg);
      this.disconnect({ reconnect: "auto" }, err);
    });
    this.ws.on("close", (code, err) => {
      if (code) {
        this.emit("warn", "WS close: " + code);
        if (code === 4001) {
          err = new Error("Invalid authentication.");
        } else if (code === 4003) {
          err = new Error(
            "WebSocket was killed by the server. This usually happens when you open the website in another tab."
          );
        } else if (code === 1006) {
          err = new Error("Connection timeout. (Ping or network)");
        }
      }
      this.disconnect({ reconnect: this.ws ? "auto" : true }, err);
    });
  }

  sendWS(op, data, ref) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      ref = ref ? ref : uuid();
      data = JSON.stringify({
        op: op,
        p: data,
        version: "0.2.0",
        ref: ref,
      });
      this.ws.send(data);
      this.emit("debug", data);
      return ref;
    }
  }

  sendWSLegacy(op, data, ref) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      ref = ref ? ref : uuid();
      data = JSON.stringify({
        op: op,
        d: data,
        fetchId: ref,
      });
      this.ws.send(data);
      this.emit("debug", data);
      return ref;
    }
  }

  auth() {
    var auth = {
      accessToken: this.token.accessToken,
      refreshToken: this.token.refreshToken,
      deafened: false,
      muted: false,
      reconnectToVoice: false,
    };
    this.sendWS(OPCodes.AUTH, auth);
  }

  wsEvent(packet) {
    switch (packet.op) {
      case OPCodes.AUTH_REPLY: {
        this.connectAttempts = 0;
        this.reconnectInterval = 1000;
        this.connecting = false;
        this.ready = true;

        this.user = packet.p;

        this.lastPingAck = true;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (!this.lastPingAck) {
            this.disconnect(
              { reconnect: "auto" },
              new Error(
                "Server didn't acknowledge previous ping, possible lost connection"
              )
            );
          }
          this.lastPingAck = false;
          this.ws.send("ping");
        }, 8000);

        /**
         * Fired when the connection is established
         * @event Moonstone#ready
         * @prop {User} user The bot user
         */
        this.emit("ready", this.user);
        break;
      }
      case OPCodes.NEW_TOKENS: {
        if (packet.d.accessToken && packet.d.refreshToken) {
          this.token.accessToken = packet.d.accessToken;
          this.token.refreshToken = packet.d.refreshToken;
        }
        /**
         * Fired when new auth tokens are sent by the server.
         * @event Moonstone#newTokens
         * @prop {Object} tokens New auth data
         */
        this.emit("newTokens", packet.d);
        break;
      }
      case OPCodes.FETCH_DONE: {
        if (packet.d.room && packet.d.activeSpeakerMap) {
          const room = new ActiveRoom(packet.d, this);
          this.rooms.add(room);
          /**
           * Fired when the bot joins a room.
           * @event Moonstone#joinedRoom
           * @prop {ActiveRoom} room The joined room
           */
          this.emit("joinedRoom", room);
        }
        break;
      }
      case OPCodes.USER_JOIN_ROOM: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          const user = room.users.add(
            new ActiveUser(packet.d.user, room, this)
          );
          room._updateVoiceStates(packet.d);
          /**
           * Fired when a user joins the room the bot is in.
           * @event Moonstone#userJoinRoom
           * @prop {ActiveUser} user The user who joined
           * @prop {ActiveRoom} room The room
           */
          this.emit("userJoinRoom", user, room);
        }
        break;
      }
      case OPCodes.USER_LEFT_ROOM: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          const user = room.users.get(packet.d.userId);
          room.users.remove(user);
          /**
           * Fired when a user leaves the room the bot is in.
           * @event Moonstone#userJoinRoom
           * @prop {ActiveUser} user The user who left
           * @prop {ActiveRoom} room The room
           */
          this.emit("userLeftRoom", user, room);
        }
        break;
      }
      case OPCodes.ACTIVE_SPEAKER_CHANGE: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          const updates = room._updateVoiceStates(packet.d, true);
          updates[0].forEach((user) =>
            /**
             * Fired when a user starts or stops speaking
             * @event Moonstone#activeSpeakerChange
             * @prop {ActiveUser} user The user whose state changed.
             * @prop {ActiveRoom} room The room
             */
            this.emit("activeSpeakerChange", user, room)
          );
          updates[1].forEach((user) =>
            /**
             * Fired when a user mutes or unmutes their microphone.
             * @event Moonstone#muteChange
             * @prop {ActiveUser} user The user whose state changed.
             * @prop {ActiveRoom} room The room
             */
            this.emit("muteChange", user, room)
          );
          updates[2].forEach((user) =>
            /**
             * Fired when a user deafens or undeafens their headphones.
             * @event Moonstone#deafenChange
             * @prop {ActiveUser} user The user whose state changed.
             * @prop {ActiveRoom} room The room
             */
            this.emit("deafenChange", user, room)
          );
        }
        break;
      }
      case OPCodes.MUTE_CHANGED: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          var user = room.users.get(packet.d.userId);
          user.voiceState.muted = packet.d.value;
          this.emit("muteChange", user, room);
        }
        break;
      }
      case OPCodes.DEAFEN_CHANGED: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          var user = room.users.get(packet.d.userId);
          user.voiceState.deafened = packet.d.value;
          this.emit("deafenChange", user, room);
        }
        break;
      }
      case OPCodes.NEW_CHAT_MSG: {
        /**
         * Fired when a new chat message is received.
         * @event Moonstone#newChatMsg
         * @prop {Message} message The received message.
         */
        this.emit("newChatMsg", new Message(packet.d.msg, this));
        break;
      }
      case OPCodes.MSG_DELETED: {
        // TODO fetch actual message object and stuff
        this.emit(
          "msgDeleted",
          packet.d.messageId,
          this.currentRoom.users.get(packet.d.deleterId)
        );
      }
      case OPCodes.JOINED_PEER: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          if (packet.d.recvTransportOptions)
            this.voiceDataCache.recvTransportOptions =
              packet.d.recvTransportOptions;
          if (packet.d.routerRtpCapabilities)
            this.voiceDataCache.routerRtpCapabilities =
              packet.d.routerRtpCapabilities;
          /**
           * Fired when the bot join a room as peer (listener).
           * @event Moonstone#joinAsPeer
           * @prop {ActiveRoom} room The joined room.
           * @prop {Object} voiceDataCache Information regarging voice connections.
           */
          this.emit("joinedAsPeer", room, this.voiceDataCache);
        }
        break;
      }
      case OPCodes.JOINED_SPEAKER: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          if (packet.d.recvTransportOptions)
            this.voiceDataCache.recvTransportOptions =
              packet.d.recvTransportOptions;
          if (packet.d.sendTransportOptions)
            this.voiceDataCache.sendTransportOptions =
              packet.d.sendTransportOptions;
          if (packet.d.routerRtpCapabilities)
            this.voiceDataCache.routerRtpCapabilities =
              packet.d.routerRtpCapabilities;
          /**
           * Fired when the bot join a room as speaker.
           * @event Moonstone#joinAsPeer
           * @prop {ActiveRoom} room The joined room.
           * @prop {Object} voiceDataCache Information regarging voice connections.
           */
          this.emit("joinedAsSpeaker", room, this.voiceDataCache);
        }
        break;
      }
      case OPCodes.NOW_SPEAKER: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          if (packet.d.sendTransportOptions)
            this.voiceDataCache.sendTransportOptions =
              packet.d.sendTransportOptions;
          room.selfUser.roomPermissions.isSpeaker = true;
          /**
           * Fired when the bot becomes a speaker in a room.
           * @event Moonstone#becameSpeaker
           * @prop {ActiveRoom} room The room where the bot became a speaker.
           * @prop {Object} voiceDataCache Information regarging voice connections.
           */
          this.emit("becameSpeaker", room, this.voiceDataCache);
        }
        break;
      }
      case OPCodes.HAND_RAISED: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          var user = room.users.get(packet.d.userId);
          user.handRaised = true;
          user.roomPermissions.askedToSpeak = true;
          room._updateVoiceStates(packet.d);
          /**
           * Fired when a user raises their hand.
           * @event Moonstone#handRaised
           * @prop {ActiveUser} user The user who raised their hand.
           * @prop {ActiveRoom} room The room in context.
           */
          this.emit("handRaised", user, room);
        }
        break;
      }
      case OPCodes.SPEAKER_ADDED: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          var user = room.users.get(packet.d.userId);
          user.roomPermissions.isSpeaker = true;
          room._updateVoiceStates(packet.d);
          /**
           * Fired when a user is added as a speaker.
           * @event Moonstone#speakerAdded
           * @prop {ActiveUser} user The user who was added as a speaker.
           * @prop {ActiveRoom} room The room in context.
           */
          this.emit("speakerAdded", user, room);
        }
        break;
      }
      case OPCodes.SPEAKER_REMOVED: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          var user = room.users.get(packet.d.userId);
          user.roomPermissions.isSpeaker = false;
          room._updateVoiceStates(packet.d);
          if (room.audioConnection && user.id == this.user.id)
            room.audioConnection.disconnect();
          /**
           * Fired when a user is removed as a speaker.
           * @event Moonstone#speakerRemoved
           * @prop {ActiveUser} user The user who was removed as a speaker.
           * @prop {ActiveRoom} room The room in context.
           */
          this.emit("speakerRemoved", user, room);
        }
        break;
      }
      case OPCodes.LEFT_ROOM: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          if (room.audioConnection && user.id == this.user.id)
            room.audioConnection.disconnect();
          /**
           * Fired when the bot leaves a room.
           * @event Moonstone#leftRoom
           * @prop {ActiveRoom} room The room the bot left from.
           * @prop {Boolean} kicked Whether the bot was kicked from the room.
           */
          this.emit("leftRoom", room, packet.d.kicked ? true : false);
        }
        break;
      }
      default:
        if (packet.op.startsWith("@")) this.emit(packet.op, packet.d);
        else if (this.options.logUnhandledPackets) console.log("-->", packet);
    }
    if (packet.ref && this.callbacks[packet.ref])
      this.callbacks[packet.ref].forEach((f) => f(packet.p));
    if (packet.fetchId && this.callbacks[packet.fetchId])
      this.callbacks[packet.fetchId].forEach((f) => f(packet.d));
  }

  waitForRef(ref, callback, errCallback) {
    if (!this.callbacks[ref]) this.callbacks[ref] = [];
    this.callbacks[ref].push(callback);
    this.callbackTimeouts.push(
      setTimeout(() => {
        errCallback("Reply timed out.");
      }, this.options.callbackTimeout)
    );
  }

  /**
   * Get the top dashboard rooms
   * @param {Number} [cursor] The pagination cursor
   * @returns {Promise<Array<Room>>}
   */
  getTopRooms(cursor = 0) {
    return new Promise((resolve, reject) => {
      this.waitForRef(
        this.sendWS(OPCodes.TOP_ROOMS, { cursor }),
        (response) => {
          resolve(response.rooms.map((room) => this.rooms.add(new Room(room))));
        },
        reject
      );
    });
  }

  /**
   * Joins a room
   * @param {Room} room The room to join
   * @returns {Promise<ActiveRoom>}
   */
  joinRoom(room) {
    const roomId = typeof room === "string" ? room : room.id || room.roomId;
    return new Promise((resolve, reject) => {
      this.waitForRef(
        this.sendWSLegacy(OPCodes.JOIN_ROOM, { roomId }),
        (response) => {
          const room = this.rooms.get(response.room.id);
          if (room) this.rooms.remove(room);
          response.id = response.room.id;
          this.currentRoom = this.rooms.add(new ActiveRoom(response, this));
          resolve(this.currentRoom);
        },
        reject
      );
    });
  }

  /**
   * Creates a room
   * @param {Object} options The room options
   * @param {String} options.name The room name
   * @param {String} [options.description] The room description
   * @param {String} [options.privacy] The room privacy
   * @returns {Promise<Room>}
   */
  createRoom({ name, description = "", privacy = "public" }) {
    return new Promise((resolve, reject) => {
      this.waitForRef(
        this.sendWS(OPCodes.CREATE_ROOM, { name, description, privacy }),
        (response) => {
          resolve(this.rooms.add(new Room(response)));
        },
        reject
      );
    });
  }

  disconnect(options, error) {
    var ws = this.ws;
    this.ws = null;
    this.ready = this.connecting = false;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.callbackTimeouts) {
      this.callbackTimeouts.forEach((id) => clearTimeout(id));
    }
    if (ws) {
      try {
        ws.close(options.reconnect);
      } catch (err) {
        this.emit("error", err);
      }
      this.emit("disconnect", error || null);
    }
    this.reset();
    if (options.reconnect === "auto" && this.options.autoReconnect) {
      this.emit(
        "debug",
        `Queueing reconnect in ${this.reconnectInterval}ms | Attempt ${this.connectAttempts}`
      );
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
      this.reconnectInterval = Math.min(
        Math.round(this.reconnectInterval * (Math.random() * 2 + 1)),
        60000
      );
    } else if (!options.reconnect) {
      this.hardReset();
    }
  }

  /**
   * Sets a user's role in the current room.
   * @param {string} role The role to set the user as (raised_hand/listener/speaker)
   * @param {User} [user] The user to set the role on, defaults to self.
   */
  async setRole(role, user) {
    await this.sendWS(OPCodes.SET_ROLE, {
      role,
      userId: user ? user.id : undefined,
    });
  }

  /**
   * Sends a chat message in the current room.
   * @param {String} content Message contnet
   * @param {Array<User>} [whisperedTo] A list of users to whisper the message to
   */
  async sendChatMessage(content, whisperedTo = []) {
    await this.sendWS(OPCodes.SEND_CHAT_MSG, {
      tokens: [{ t: "text", v: content }],
      whisperedTo: whisperedTo.map((u) => u.id),
    });
  }

  /**
   * Sets wheter the bot is speaking or not (red circle around picture)
   * @param {Boolean} value Whether the bot is speaking or not.
   */
  async setSpeaking(value) {
    await this.sendWS(OPCodes.SET_SPEAKING, { active: value });
  }

  reset() {
    this.connecting = false;
    this.ready = false;
    this.lastPingAck = true;
    this.voiceDataCache = {};
  }

  hardReset() {
    this.reset();
    this.reconnectInterval = 1000;
    this.connectAttempts = 0;
    this.ws = null;
    this.pingInterval = null;
  }
}

module.exports = Moonstone;
