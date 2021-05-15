const User = require("./User");

/**
 * Represents an active (joined) room
 * @extends {User}
 */
class ActiveUser extends User {
  
  /**
   * The voice state of a user
   * @typedef {Object} VoiceState
   * @property {boolean} deafened Whether the user is deafened
   * @property {boolean} muted Whether the user is muted
   * @property {boolean} speaking Whether the user is currently speaking
   */

  /**
   * The permissions of a user in a room
   * @typedef {Object} RoomPermissions
   * @param {boolean} isSpeaker Whether the user has been added as a speaker
   * @param {boolean} askedToSpeak Whether the user has asked to speak
   * @param {boolean} isMod Whether the user is a moderator 
   */

  /**
   * @param {Object} data The data for the user
   * @param {ActiveRoom} room The room the user belongs to
   * @param {Moonstone} client The client that controls this user
   */
  constructor(data, room, client) {
    super(data, client);
    this._client = client;

    /**
     * The room this user object belongs to
     * @type {ActiveRoom}
     */
    this.room = room;

    /**
     * The voice state of the user
     * @type {VoiceState}
     */
    this.voiceState = { deafened: false, muted: false, speaking: false };

    /**
     * The permissions the user has in the room
     * @type RoomPermissions
     */
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
   * @param {String|Function|Object} content The message content
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

  /**
   * Sets the user's auth level
   * @param {string} authLevel The new auth level, either `user`, `mod`, or `owner`
   */
  setAuthLevel(authLevel) {
    return this._client.setUserAuthLevel(this, authLevel);
  }

  /**
   * Whether the user is the creator of the room they're in
   * @type {boolean}
   */
  get isCreator() {
    return this.id == this.room.creatorId;
  }

  /**
   * Whether the user is currently a speaker
   * @type {boolean}
   */
  get isSpeaker() {
    return this.isCreator || this.roomPermissions.isSpeaker;
  }
}

module.exports = ActiveUser;
