const Collection = require("../utils/Collection");

class Room {
  constructor(data, client) {
    this.id = data.id;
    this.update(data);
  }

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
