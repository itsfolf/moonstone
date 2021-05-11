/**
 * Represents a user
 * @prop {String} id The user's account id
 * @prop {String} username The user's username
 * @prop {String} avatarUrl The user's avatar url
 * @prop {String?} bannerUrl The user's banner url
 * @prop {String} bio The user's bio
 * @prop {Boolean} online Whether the user is currently online
 * @prop {String} lastOnline The date at which the user was last online
 * @prop {String?} currentRoomId The id of the room the user is currently in
 * @prop {String} displayName The user's full name
 * @prop {Number} numFollowing The number of people the user is following
 * @prop {Number} numFollowers The number of people that follow the user
 * @prop {Boolean} youAreFollowing Whether you are following the user
 * @prop {Boolean} followsYou Whether the user follows you
 * @prop {String?} botOwnerId The account id of the bot owner, in case this user is a bot.
 */
class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.avatarUrl = data.avatarUrl;
    this.bannerUrl = data.bannerUrl;
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

	/**
	 * Updates the user.
	 * @param {Object} data The data.
	 */
  update(data) {
    this.username = data.username;
    this.avatarUrl = data.avatarUrl;
    this.bannerUrl = data.bannerUrl;
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
