'use strict';
const Handler = require('../handler/base');
const utils = require('../utils/utils');
const consts = require('../utils/const');

class GameServer extends Handler {
  constructor(connector, opts) {
    super(connector, opts);
    this.handler = null;
    this.connector = connector;
  }

  onEvent(eventName, data, cb) {
    switch (eventName) {
      case `${this.serverId}/${consts.EVENT.EVT_CREATE_ROOM}`:
        if (this.handler && data) {
          this.handler.onCreateRoom(data, cb);
        }
        break;
      case consts.EVENT.EVT_PLAYER_LOGIN:
        if (this.handler && data) {
          this.handler.onPlayerLogin(data, cb);
        }
        break;
      case `${this.serverId}/${consts.EVENT.EVT_STOPPED}`:
        if (this.handler && data) {
          this.handler.onStopServer(data, cb);
        }
        break;
    }
  }

  onStarted(data) {
    console.log("StartedEvent: ", data);
    this.serverId = data.serverId
    this.addEvent(`${data.serverId}/${consts.EVENT.EVT_CREATE_ROOM}`);
    this.addEvent(`${data.serverId}/${consts.EVENT.EVT_STOPPED}`);
    this.addEvent(consts.EVENT.EVT_PLAYER_LOGIN);
    this.connector.broadcast(consts.EVENT.EVT_STARTTED, data);
  }

  onStopped(data) {
    console.log("StoppedEvent: ", data);
    this.connector.broadcast(consts.EVENT.EVT_STOPPED, data);
  }

  onJoinRoom(rid, uid, extra, cb) {
    console.log("JoinRoomEvent: ", rid, uid, extra);
    this.connector.broadcast(consts.EVENT.EVT_JOIN_GAME, {rid, uid, extra});
    return utils.invoke(cb);
  }

  onLeaveRoom(rid, uid, extra, cb) {
    console.log("LeaveRoomEvent: ", rid, uid, extra);
    this.connector.broadcast(consts.EVENT.EVT_LEAVE_GAME, {rid, uid, extra});
    return utils.invoke(cb);
  }

  onChangeProfile(uid, data, cb) {
    console.log("ChangeProfileEvent: ", uid, data);
    this.connector.broadcast(consts.EVENT.EVT_CHANGE_PROFILE, {uid, data});
    return utils.invoke(cb);
  }
  close(cb) {
    this.connector.close(cb)
  }
  setHandler(handler) {
    this.handler = handler;
  }
}

module.exports = GameServer;
