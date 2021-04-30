class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.avatarUrl = data.avatarUrl;
    this.bio = data.bio;
    this.online = data.online;
    this.lastOnline = data.lastOnline;
    this.currentRoomId = data.currentRoomId;
    this.displayName = data.displayName;
    this.numFollowing = data.numFollowing;
    this.numFollowers = data.numFollowers;
    this.youAreFollowing = data.youAreFollowing ? true : false;
    this.followsYou = data.followsYou ? true : false;
    this.botOwnerId = data.botOwnerId;
    this.update(data);
  }

  update(data) {
    this.username = data.username;
    this.avatarUrl = data.avatarUrl;
    this.bio = data.bio;
    this.online = data.online;
    this.lastOnline = data.lastOnline;
    this.currentRoomId = data.currentRoomId;
    this.displayName = data.displayName;
    this.numFollowing = data.numFollowing;
    this.numFollowers = data.numFollowers;
    this.youAreFollowing = data.youAreFollowing ? true : false;
    this.followsYou = data.followsYou ? true : false;
    this.botOwnerId = data.botOwnerId;
  }
}

module.exports = User;
