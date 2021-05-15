const Room = require("./Room");

const Collection = require("../utils/Collection");
const ActiveUser = require("./ActiveUser");
const AudioConnection = require("../audio/AudioConnection");

/**
 * Represents a room that you are connected to
 * @extends {Room}
 */
class ActiveRoom extends Room {
  constructor(data, client) {
    super(data.room, client);

    /**
     * The users in this room
     * @type {Collection<ActiveUser>}
     */
    this.users = new Collection(ActiveUser);

    this._client = client;
    this.update(data);
  }

  update(data) {
    super.update(data);

    if (data.autoSpeaker !== undefined) {
      /**
       * Whether you automatically become a speaker when you ask to speak
       * @type {boolean}
       */
      this.autoSpeaker = data.autoSpeaker;
    }

    if (data.users !== undefined) {
      data.users.forEach((user) =>
        this.users.add(new ActiveUser(user, this, this._client))
      );
      this._updateVoiceStates(data);
    }
  }

  _updateVoiceStates(data, returnChanges = false) {
    const _trueValue = (val) => (val ? true : false);
    let updated = [[], [], []];
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

  /**
   * Sets your role as raised hand
   * @return {Promise}
   */
  async askToSpeak() {
    await this._client.setRole("raised_hand");
  }

  /**
   * Sends a chat message
   * @param {String|Function|Object} content The message content
   * @return {Promise}
   */
  async sendChatMessage(content) {
    await this._client.sendChatMessage(content);
  }

  /**
   * Connects to the room's audio server
   * @returns {Promise<AudioConnection>}
   */
  async connect() {
    this.audioConnection =
      this.audioConnection ||
      new AudioConnection(this._client, this._client.voiceDataCache);

    await this.audioConnection.connect();
    return this.audioConnection;
  }

  /**
   * The current bot user in this room
   * @type {ActiveUser}
   */
  get selfUser() {
    return this.users.get(this._client.user.id);
  }
}

module.exports = ActiveRoom;
