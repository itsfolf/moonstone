
/**
 * Represents a chat message
 */
class Message {
  constructor(data, client) {
    /**
     * The id of the user who sent the message
     * @type {String}
     */
    this.userId = data.userId;

    /**
     * The room the message was sent in
     * @type {ActiveRoom}
     */
    this.room = client.currentRoom;

    /**
     * The tokens that make up the message
     * @type {Array<Object>}
     */
    this.tokens = data.tokens;

    /**
     * The date and time at which the message was sent
     * @type {String}
     */
    this.sentAt = data.sentAt;

    /**
     * Whether this message is a whisper
     * @type {boolean}
     */

    this.isWhisper = data.isWhisper;

    /**
     * The text (parsed) content of this message
     * @type {String}
     */
    this.content = this.tokens
      .map((token) => {
        switch (token.t) {
          case "text":
          case "link":
            return token.v;
          case "mention":
            return "@" + token.v;
          case "block":
            return "`" + token.v + "`";
          case "emote":
            return ":" + token.v + ":";
          default:
            throw new Error("Invalid chat token type received: " + token.t);
        }
      })
      .join(" ");
  }

  /**
   * The user that sent this message
   * @type {ActiveUser}
   */
  get user() {
    return this.room.users.get(this.userId);
  }
}

module.exports = Message;
