/**
 * Represents a chat message
 * @prop {String} userId The message author's account id
 * @prop {ActiveUser} user The message author
 * @prop {ActiveRoom} room The room on which the message was sent
 * @prop {Array<Object>} tokens The raw message tokens
 * @prop {String} sentAt The time at which the message was sent
 * @prop {Boolean} isWhisper Whether the message is a whisper
 * @prop {Boolean} isPrivate Whether the room is private
 */
class Message {
  constructor(data, client) {
    this.userId = data.userId;
    this.room = client.currentRoom;
    this.tokens = data.tokens;
    this.sentAt = data.sentAt;
    this.isWhisper = data.isWhisper;
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
	 * The message author.
	 * @type {import('./User')}
	 */
  get user() {
    return this.room.users.get(this.userId);
  }
}

module.exports = Message;
