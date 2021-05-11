const Collection = require("../utils/Collection");

/**
 * Represents a room
 * @prop {String} name The room's name
 * @prop {String} description The room's description
 * @prop {Boolean} isPrivate Whether the room is private
 * @prop {String} insertedAt The date at which the room was inserted into the list
 */
class Room {
  constructor(data, client) {
    this.id = data.id;
    this.update(data);
  }

	/**
	 * Updates the room.
	 * @param {Object} data The data.
	 */
  update(data) {
    if (data.name != undefined) this.name = data.name;
    if (data.description != undefined) this.description = data.description;
    if (data.isPrivate != undefined) this.isPrivate = data.isPrivate;
    if (data.creatorId != undefined) this.creatorId = data.creatorId;
    // TODO peoplePreviewList
    if (data.insertedAt != undefined) this.insertedAt = data.inserted_at;
  }
}

module.exports = Room;
