const User = require("./User");

/**
 * Represents a user who is connected to the same room as you
 * @prop {Object} voiceState The user's voice state
 * @prop {Boolean?} voiceState.muted Whether the user's microphone is muted
 * @prop {Boolean?} voiceState.deafened Whether the user's headphones are deafened
 * @prop {Boolean?} voiceState.speaking Whether the user's currently speaking
 * @prop {Boolean} isSpeaker Whether the user is a speaker in the room
 * @prop {Object} roomPermissions The permissions of the user in the room
 * @prop {Boolean?} roomPermissions.isSpeaker Whether the user has been given permission to speak
 * @prop {Boolean?} roomPermissions.askedToSpeak Whether the user has asked to speak
 * @prop {Boolean?} roomPermissions.isMod Whether the user is a moderator in the current room
 * @prop {Boolean} isCreator Whether the user created the current room
 */
class ActiveUser extends User {
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

  /**
   * Sends a whisper to the user
   * @param {String} content The message content
   * @return {Promise}
   */
  async sendWhisper(content) {
    await this._client.sendChatMessage(content, [this]);
  }

  /**
   * Sets the user's role as listener
   * @return {Promise}
   */
  async setAsListener() {
    await this._client.setRole("listener", this);
  }

  /**
   * Sets the user's role as speaker
   * @return {Promise}
   */
  async setAsSpeaker() {
    await this._client.setRole("speaker", this);
  }

  get isCreator() {
    return this.id == this._room.creatorId;
  }

  get isSpeaker() {
    return this.isCreator || this.roomPermissions.isSpeaker;
  }
}

module.exports = ActiveUser;
