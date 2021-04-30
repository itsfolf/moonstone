const User = require("./User");

class RoomUser extends User {
  constructor(data, client) {
    super(data, client);
    this._client = client;
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
}

module.exports = RoomUser;
