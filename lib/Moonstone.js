const EventEmitter = require("events").EventEmitter;
const WebSocket = require("ws");
const OPCodes = require("./Constants").OPCodes;
const uuid = require("uuid").v4;

const Collection = require("./utils/Collection");
const Room = require("./core/Room");
const ActiveRoom = require("./core/ActiveRoom");
const RoomUser = require("./core/RoomUser");
const Message = require("./core/Message");

class Moonstone extends EventEmitter {
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
  }

  connect() {
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
      this.emit("error", new Error("Existing connection detected"));
    }
    this.connectAttempts++;
    this.connecting = true;

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
    setTimeout(() => {
      if (this.connecting) {
        this.disconnect(null, new Error("Connection timeout"));
      }
    }, this.options.connectionTimeout);
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
    if (this.token.token) {
      console.log("TODO bot tokens");
    }
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

        this.emit("ready", this.user);
        break;
      }
      case OPCodes.NEW_TOKENS: {
        if (packet.d.accessToken && packet.d.refreshToken) {
          this.token.accessToken = packet.d.accessToken;
          this.token.refreshToken = packet.d.refreshToken;
        }
        this.emit("newTokens", packet.d);
        break;
      }
      case OPCodes.FETCH_DONE: {
        if (packet.d.room && packet.d.activeSpeakerMap) {
          const room = new ActiveRoom(packet.d, this);
          this.rooms.add(room);
          this.emit("joinedRoom", room);
        }
        break;
      }
      case OPCodes.USER_JOIN_ROOM: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          const user = room.users.add(new RoomUser(packet.d.user, this));
          room._updateVoiceStates(packet.d);
          this.emit("userJoinRoom", user, room);
        }
        break;
      }
      case OPCodes.USER_LEFT_ROOM: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          const user = room.users.get(packet.d.userId);
          room.users.remove(user);
          this.emit("userLeftRoom", user, room);
        }
        break;
      }
      case OPCodes.ACTIVE_SPEAKER_CHANGE: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          const updates = room._updateVoiceStates(packet.d, true);
          updates[0].forEach((user) =>
            this.emit("activeSpeakerChange", user, room)
          );
          updates[1].forEach((user) => this.emit("muteChange", user, room));
          updates[0].forEach((user) => this.emit("deafenChange", user, room));
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
          this.emit("joinedAsPeer", room, this.voiceDataCache);
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
          this.emit("speakerRemoved", user, room);
        }
        break;
      }
      case OPCodes.LEFT_ROOM: {
        var room = this.rooms.get(packet.d.roomId);
        if (room) {
          this.emit("leftRoom", room, packet.d.kicked ? true : false);
        }
        break;
      }
      default:
        if (this.options.logUnhandledPackets) console.log("-->", packet);
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

  async setRole(role) {
    await this._client.sendWS(OPCodes.SET_ROLE, { role });
  }

  async sendChatMessage(content, whisperedTo = []) {
    await this.sendWS(OPCodes.SEND_CHAT_MSG, {
      tokens: [{ t: "text", v: content }],
      whisperedTo: whisperedTo.map((u) => u.id),
    });
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
