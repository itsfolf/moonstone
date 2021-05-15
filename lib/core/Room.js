/**
 * Represents a room
 */
class Room {
  constructor(data) {
    this.id = data.id;
    this.update(data);
  }

  update(data) {
    if ('name' in data) {
      /**
       * The name of the room
       * @type {string}
       */
      this.name = data.name;
    }

    if ('description' in data) {
       /**
       * The description of the room
       * @type {string}
       */
      this.description = data.description;
    }

    if ('isPrivate' in data) {
      /**
       * Whether the room is private
       * @type {boolean}
       */
      this.isPrivate = data.isPrivate;
    }

    if ('creatorId' in data) {
      /**
       * The id of the room creator
       * @type {string}
       */
      this.creatorId = data.creatorId;
    }

    if ('insertedAt' in data) {
      /**
       * The date and time at which the room was added
       * @type {string}
       */
      this.insertedAt = data.inserted_at;
    }
    
    // TODO peoplePreviewList
  }
}

module.exports = Room;
