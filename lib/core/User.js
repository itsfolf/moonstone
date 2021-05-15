/**
 * Represents a user
 */
class User {
  /**
   * @param {Object} data The data for the user
   */
  constructor(data) {

    /**
     * The id of the user
     * @type {string}
     */
    this.id = data.id;

    /**
     * The username of the user
     * @type {string}
     */
    this.username = data.username;

    /**
     * The url of the user avatar
     * @type {string?}
     */
    this.avatarUrl = data.avatarUrl;

    /**
     * The url of the user banner
     * @type {string?}
     */
    this.bannerUrl = data.bannerUrl;

    /**
     * The bio of the user
     * @type {string}
     */
    this.bio = data.bio;

    /**
     * Whether the user is online
     * @type {boolean}
     */
    this.online = data.online;

    /**
     * When the user was last online
     * @type {string}
     */
    this.lastOnline = data.lastOnline;

    /**
     * The id of the room the user is currently in
     * @type {string?}
     */
    this.currentRoomId = data.currentRoomId;

    /**
     * The display name (full name) of the user
     * @type {string}
     */
    this.displayName = data.displayName;

    /**
     * The number of people the user is following
     * @type {number}
     */
    this.numFollowing = data.numFollowing;

    /**
     * The number of people the user is followed by
     * @type {number}
     */
    this.numFollowers = data.numFollowers;

    /**
     * Whether you (the bot) are following this user
     * @type {boolean}
     */
    this.youAreFollowing = data.youAreFollowing ? true : false;

    /**
     * Whether this user follows you (the bot).
     * @type {boolean}
     */
    this.followsYou = data.followsYou ? true : false;

    /**
     * The id of the bot owner, in case this user is a bot.
     * @type {string?}
     */
    this.botOwnerId = data.botOwnerId;

    this.update(data);
  }

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
