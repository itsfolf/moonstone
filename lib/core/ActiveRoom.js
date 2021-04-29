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
      data.users.forEach((user) => this.users.add(new RoomUser(user)));
      this.updateVoiceStates(data);
    }
  }

  updateVoiceStates(data, returnChanges = false) {
    var updated = [[], [], []];
    this.users.forEach((user) => {
      if (
        data.activeSpeakerMap !== undefined &&
        user.speaking != data.activeSpeakerMap[user.id]
      ) {
        user.speaking = data.activeSpeakerMap[user.id];
        if (returnChanges) updated[0].push(user);
      }

      if (data.muteMap !== undefined && user.muted != data.muteMap[user.id]) {
        user.muted = data.muteMap[user.id];
        if (returnChanges) updated[1].push(user);
      }

      if (
        data.deafMap !== undefined &&
        user.deafened != data.deafMap[user.id]
      ) {
        user.deafened = data.deafMap[user.id];
        if (returnChanges) updated[2].push(user);
      }
    });
    return updated;
  }

  async askToSpeak() {
    await this._client.sendWS(OPCodes.SET_ROLE, { role: "raised_hand" });
  }
}

module.exports = ActiveRoom;
