const User = require("./User");

class RoomUser extends User {
  constructor(data, room, client) {
    super(data, client);
    this._client = client;
    this._room = room;
    this.voiceState = { deafened: false, muted: false, speaking: false };
    this.roomPermissions = {};
    this.update(data);
  }

  update(data) {
    super.update(data);
    if (data.roomPermissions !== undefined && data.roomPermissions != null)
      this.roomPermissions = data.roomPermissions;
  }

  async sendWhisper(content) {
    await this._client.sendChatMessage(content, [this]);
  }

  async setAsListener() {
    await this._client.setRole("listener", this);
  }

  async setAsSpeaker() {
    await this._client.setRole("speaker", this);
  }

  get isSpeaker() {
    return this.id == this._room.creatorId || this.roomPermissions.isSpeaker;
  }
}

module.exports = RoomUser;
