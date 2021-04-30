const Room = require("./Room");

const Collection = require("../utils/Collection");
const RoomUser = require("./RoomUser");
const OPCodes = require("../Constants").OPCodes;

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
        this.users.add(new RoomUser(user, this._client))
      );
      this._updateVoiceStates(data);
    }
  }

  _updateVoiceStates(data, returnChanges = false) {
    var updated = [[], [], []];
    this.users.forEach((user) => {
      if (
        data.activeSpeakerMap !== undefined &&
        user.voiceState.speaking != data.activeSpeakerMap[user.id]
      ) {
        user.voiceState.speaking = data.activeSpeakerMap[user.id];
        if (returnChanges) updated[0].push(user);
      }

      if (
        data.muteMap !== undefined &&
        user.voiceState.muted != data.muteMap[user.id]
      ) {
        user.voiceState.muted = data.muteMap[user.id];
        if (returnChanges) updated[1].push(user);
      }

      if (
        data.deafMap !== undefined &&
        user.voiceState.deafened != data.deafMap[user.id]
      ) {
        user.voiceState.deafened = data.deafMap[user.id];
        if (returnChanges) updated[2].push(user);
      }

      if (
        data.raiseHandMap !== undefined &&
        user.roomPermissions.askedToSpeak != data.raiseHandMap[user.id]
      ) {
        user.roomPermissions.askedToSpeak = data.raiseHandMap[user.id];
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
}

module.exports = ActiveRoom;
