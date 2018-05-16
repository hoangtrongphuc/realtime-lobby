'use strict';
class Room {
  constructor(roomId, serverInfo) {
    this.rid = roomId;
    this.players = [];
    this.roomInfo = null;
    this.serverInfo = serverInfo;
  }

  joinRoom(uid) {
    if (this.players.indexOf(uid) == -1) {
      this.players.push(uid);
    }
  }

  leaveRoom(uid) {
    let pos = this.players.indexOf(uid);
    if (pos != -1) {
      this.players.splice(pos, 1);
    }
  }

  hasInRoom(uid) {
    return this.players.indexOf(uid) != -1;
  }

  getUidWithout(uid) {
    let pos = this.players.indexOf(uid);
    if (pos == 1) return this.players[0];
    else return this.players[1];
  }

  uids() {
    return this.players;
  }

  isFull() {
    return this.players.length >= 2;
  }

  isEmpty() {
    return this.players.length == 0;
  }
}

module.exports = Room;