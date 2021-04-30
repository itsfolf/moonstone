const Room = require("./Room");

const Collection = require("../utils/Collection");
const RoomUser = require("./RoomUser");
const OPCodes = require("../Constants").OPCodes;
const AudioConnection = require("../audio/AudioConnection");

class ActiveRoom extends Room {
  constructor(data, client) {
    super(data.room, client);
    this.users = new Collection(RoomUser);
    this._client = client;
    this.update(data);
  }

  update(data) {
    super.update(data);

    if (data.autoSpeaker !== undefined) this.autoSpeaker = data.autoSpeaker;
    if (data.users !== undefined) {
      data.users.forEach((user) =>
        this.users.add(new RoomUser(user, this, this._client))
      );
      this._updateVoiceStates(data);
    }
  }

  _updateVoiceStates(data, returnChanges = false) {
    const _trueValue = (val) => (val ? true : false);
    var updated = [[], [], []];
    this.users.forEach((user) => {
      if (
        data.activeSpeakerMap !== undefined &&
        user.voiceState.speaking != _trueValue(data.activeSpeakerMap[user.id])
      ) {
        user.voiceState.speaking = _trueValue(data.activeSpeakerMap[user.id]);
        if (returnChanges) updated[0].push(user);
      }

      if (
        data.muteMap !== undefined &&
        user.voiceState.muted != _trueValue(data.muteMap[user.id])
      ) {
        user.voiceState.muted = _trueValue(data.muteMap[user.id]);
        if (returnChanges) updated[1].push(user);
      }

      if (
        data.deafMap !== undefined &&
        user.voiceState.deafened != _trueValue(data.deafMap[user.id])
      ) {
        user.voiceState.deafened = _trueValue(data.deafMap[user.id]);
        if (returnChanges) updated[2].push(user);
      }

      if (
        data.raiseHandMap !== undefined &&
        user.roomPermissions.askedToSpeak !=
          _trueValue(data.raiseHandMap[user.id])
      ) {
        user.roomPermissions.askedToSpeak = _trueValue(
          data.raiseHandMap[user.id]
        );
      }
    });
    return updated;
  }

  async askToSpeak() {
    await this._client.setRole("raised_hand");
  }

  async sendChatMessage(content) {
    await this._client.sendChatMessage(content);
  }

  async connect() {
    this.audioConnection =
      this.audioConnection ||
      new AudioConnection(this._client, this._client.voiceDataCache);

    await this.audioConnection.connect();
    return this.audioConnection;
  }

  get selfUser() {
    return this.users.get(this._client.user.id);
  }
}

module.exports = ActiveRoom;
