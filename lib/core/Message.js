class Message {
  constructor(data, client) {
    this.userId = data.userId;
    this.room = client.currentRoom;
    this.user = this.room ? this.room.users.get(this.userId) : undefined;
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
}

module.exports = Message;
