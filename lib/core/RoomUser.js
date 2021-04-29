const User = require("./User");

class RoomUser extends User {
  constructor(data, client) {
    super(data, client);
    this.deafened = false;
    this.muted = false;
    this.speaking = false;
    this.roomPermissions = {};
    this.update(data);
  }

  update(data) {
    super.update(data);
    if (data.roomPermissions !== undefined)
      this.roomPermissions = data.roomPermissions;
  }
}

module.exports = RoomUser;
