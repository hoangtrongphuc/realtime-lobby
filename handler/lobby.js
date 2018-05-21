'use strict';
const uuid = require('uuid/v4');
const Handler = require('./base');
const _ = require('lodash');
const moment = require('moment')
const Room = require('../logic/room');
//const applyFilter = require('loopback-filters');
const consts = require('../utils/const');
const utils = require('../utils/utils');
const balance = require('../utils/lobbyBalance').balance;

class LobbyApi extends Handler {
  constructor(config) {
    super(config)
    this.players = {};
    this.playerInfos = {};
    this.serverInfos = {};
    this.rooms = {};
    this.waitRoom = {};
    this.coOpRoom = {};
    this.cancelTimeStamp = new Map();
    setInterval(function () {
      this.checkServerIdle(this.serverInfos, this.playerInfos, this.rooms)
    }.bind(this), 300000)

    this.connector.presence((uid, login) => {
      if (login) {
        console.log(uid, 'login')

      } else {
        console.log(uid, 'disconnect')
        if (!this.players[uid]) this.cancelPlay({uid});
        delete this.playerInfos[uid];
      }
    })
  }

  init() {
    this.addEvent(consts.EVENT.EVT_CHECK_ROOM);
    this.addEvent(consts.EVENT.EVT_STARTTED);
    this.addEvent(consts.EVENT.EVT_STOPPED);
    this.addEvent(consts.EVENT.EVT_CANCEL_PLAY);
    this.addEvent(consts.EVENT.EVT_PLAYNOW);
    this.addEvent(consts.EVENT.EVT_PLAY_COOP);
    this.addEvent(consts.EVENT.EVT_JOIN_GAME);
    this.addEvent(consts.EVENT.EVT_LEAVE_GAME);
    this.addEvent(consts.EVENT.EVT_CHANGE_PROFILE);
  }

  onEvent(eventName, data, cb) {
    console.log("Event: ", eventName, data);
    switch (eventName) {
      case consts.EVENT.EVT_STARTTED:
        this.addServer(data);
        utils.invoke(cb);
        break;
      case consts.EVENT.EVT_STOPPED:
        this.removeServer(data);
        utils.invoke(cb);
        break;
      case consts.EVENT.EVT_PLAYNOW:
        this.playnow(data, cb);
        break;
      case consts.EVENT.EVT_CANCEL_PLAY:
        this.cancelPlay(data, cb);
        break;
      case consts.EVENT.EVT_PLAY_COOP:
        this.playCoop(data, cb);
        break;
      case consts.EVENT.EVT_CHANGE_PROFILE:
        this.changeProfile(data, cb);
        break;
      case consts.EVENT.EVT_JOIN_GAME:
        this.joinGame(data, cb);
        break;
      case consts.EVENT.EVT_LEAVE_GAME:
        this.leaveGame(data, cb);
        break;
      case consts.EVENT.EVT_CHECK_ROOM:
        this.checkRoom(data, cb);
        break;
      default:
        break;
    }
  }

  checkServerIdle(serverInfos, playerInfos, rooms) {
    console.log('checkServerIdle')
    let serversCount = _.keys(serverInfos).length
    let ccu = _.keys(playerInfos).length;
    let countRooms = _.keys(rooms).length;

    console.error('serverList', serverInfos);
    console.error('CCU', ccu);
    console.error('countRooms', countRooms);

    if (serversCount <= 2) return;
    if (ccu > ((serversCount * 80) / 2)) return;
    for (let instanceId in serverInfos) {
      if (serverInfos.hasOwnProperty(instanceId)) {
        if (serverInfos[instanceId].countRooms == 0 && serverInfos[instanceId].countPlayers == 0) {
          this.removeServer(serverInfos[instanceId])
          this.connector.send(`${instanceId}/${consts.EVENT.EVT_STOPPED}`, {instanceId}, (err, data) => {
            console.log('Delete ', instanceId, data)
          })
          serversCount--;
          if (ccu > ((serversCount * 80) / 2) || serversCount <= 2) return;
        }
      }
    }
  }

  changeProfile({uid, data}, cb) {
    console.log('change Profile', uid, data)
    if (data) {
      this.playerInfos[uid] = data;
    }
  }

  checkRoom({uid, token}, cb) {
    if (this.playerInfos[uid]) {
      return utils.invoke(cb, consts.ERROR.PLAYER_DUPLICATE);
    }
    this.connector.send(consts.EVENT.EVT_PLAYER_LOGIN, {uid, token}, (err, data) => {
      if (!err && data) {
        console.log('Response from game Server', err, data)
        this.playerInfos[uid] = data;
        if (this.players[uid]) {
          let room = this.rooms[this.players[uid]];
          this.connector.broadcast(uid, {
            serverInfo: room.serverInfo,
            roomInfo: room.roomInfo
          });
          return utils.invoke(cb, {check: true});
        } else {
          return utils.invoke(cb, {check: false});
        }
      }
    })

  }

  addServer(serverInfo) {
    let serverId = serverInfo.serverId;
    serverInfo.countRooms = 0;
    serverInfo.countPlayers = 0;

    if (serverId) {
      this.serverInfos[serverId] = serverInfo;
    }
  }

  removeServer(serverInfo) {
    if (this.serverInfos[serverInfo.serverId]) {
      delete this.serverInfos[serverInfo.serverId];
    }
  }

  playCoop(userInfo, cb) {

    let uid = userInfo.uid;
    if (!this.playerInfos[uid]) return utils.invoke(cb, consts.ERROR.PLAYER_INVALID);
    let fid = userInfo.fid;
    let zone = this.playerInfos[uid].zone;
    if (!zone) return utils.invoke(cb, consts.ERROR.PLAYER_INVALID);
    let timestamp = userInfo.timestamp;

    console.log('playCoop', userInfo, zone)
    if (fid) {
      if (!this.playerInfos[fid]) return utils.invoke(cb, consts.ERROR.PLAYER_INVALID);
      if (uid == fid) {
        this.connector.broadcast(fid, consts.ERROR.PLAYER_DUPLICATE);
        return utils.invoke(cb, {});
      }
      if (timestamp) {
        console.log((moment().diff(moment(startTime))).asMinutes())
        if (moment.duration(moment().diff(moment(startTime))).asMinutes() > consts.TIMEOUT) {
          this.connector.broadcast(fid, consts.ERROR.TIMEOUT);
          return utils.invoke(cb, {});
        } else if (this.cancelTimeStamp.get(timestamp + uid)) {
          this.connector.broadcast(fid, consts.ERROR.PLAYER_CANCEL);
          return utils.invoke(cb, {});
        }
      }
      this.connector.checkOnline(fid, check => {
        console.log('check', check)
        if (!check) {
          this.connector.broadcast(uid, consts.ERROR.PLAYER_OFFLINE);
          return utils.invoke(cb, {});
        } else {
          if (this.players[uid]) {
            let room = this.rooms[this.players[uid]];
            this.connector.broadcast(uid, {
              serverInfo: room.serverInfo,
              roomInfo: room.roomInfo
            });
            this.connector.broadcast(fid, consts.ERROR.PLAYER_IN_ROOM);
          } else if (this.players[fid]) {
            let room = this.rooms[this.players[fid]];
            this.connector.broadcast(fid, {
              serverInfo: room.serverInfo,
              roomInfo: room.roomInfo
            });
            this.connector.broadcast(uid, consts.ERROR.PLAYER_IN_ROOM);
          } else {
            let serverGame = balance(userInfo, this.serverInfos)
            if (!serverGame) {
              this.connector.broadcast(uid, consts.ERROR.SERVER_NOT_FOUND);
              return utils.invoke(cb, {});
            } else {
              let rid = uuid();
              this.rooms[rid] = new Room(rid, serverGame);
              this.cancelPlay({uid})
              this.cancelPlay({fid})
              this.rooms[rid].joinRoom(uid);
              this.rooms[rid].joinRoom(fid);
              console.log(this.rooms[rid])
              this.connector.send(`${this.rooms[rid].serverInfo.serverId}/${consts.EVENT.EVT_CREATE_ROOM}`, {
                rid: rid,
                extra: {
                  map: zone || 1,
                  players: this.rooms[rid].players,
                  mode: consts.GAME_MODE.COOP,
                }
              }, (err, roomInfo) => {
                this.createRoom(roomInfo);
              });
            }
          }
        }
      })
    } else {
      if (this.players[uid]) {
        let room = this.rooms[this.players[uid]];
        this.connector.broadcast(uid, {
          serverInfo: room.serverInfo,
          roomInfo: room.roomInfo
        });
      } else {
        if (!this.coOpRoom[zone]) {
          let rid = uuid();
          this.coOpRoom[zone] = new Room(rid);
          this.rooms[rid] = this.coOpRoom[zone];
        }
        this.cancelPlay({uid})
        this.coOpRoom[zone].joinRoom(uid);
        if (this.coOpRoom[zone].isFull()) {
          let serverGame = balance(userInfo, this.serverInfos)
          if (!serverGame) {
            delete this.rooms[this.coOpRoom[zone].rid]
            this.coOpRoom[zone] = null;
            this.connector.broadcast(uid, consts.ERROR.SERVER_NOT_FOUND);
            return utils.invoke(cb, {});
          } else {
            this.coOpRoom[zone].serverInfo = serverGame;
            this.connector.send(`${this.coOpRoom[zone].serverInfo.serverId}/${consts.EVENT.EVT_CREATE_ROOM}`, {
              rid: this.coOpRoom[zone].rid,
              extra: {
                map: zone,
                players: this.coOpRoom[zone].players,
                mode: consts.GAME_MODE.COOP,
              }
            }, (err, roomInfo) => {
              this.createRoom(roomInfo);
            });
            this.coOpRoom[zone] = null;
          }
        }
      }
      return utils.invoke(cb, {});
    }
  }

  cancelPlay(userInfo) {
    let uid = userInfo.uid;
    let zone = null;
    if (this.playerInfos[uid]) zone = this.playerInfos[uid].zone;
    if (this.players[uid] || !zone) return

    let timestamp = userInfo.timestamp;
    if (this.waitRoom[zone] && this.waitRoom[zone].players.indexOf(uid) != -1) {
      this.waitRoom[zone].leaveRoom(uid)
    }
    if (this.coOpRoom[zone] && this.coOpRoom[zone].players.indexOf(uid) != -1) {
      this.coOpRoom[zone].leaveRoom(uid)
    }
    if (timestamp) {
      this.cancelTimeStamp.set(timestamp + uid, uid)
    }
  }

  playnow(userInfo, cb) {
    let uid = userInfo.uid;
    if (!this.playerInfos[uid]) return utils.invoke(cb, consts.ERROR.PLAYER_INVALID);
    let zone = this.playerInfos[uid].zone;
    console.log('playnow Zone', zone)
    if (!zone) return utils.invoke(cb, consts.ERROR.PLAYER_INVALID);
    if (this.players[uid]) {
      let room = this.rooms[this.players[uid]];
      this.connector.broadcast(uid, {
        serverInfo: room.serverInfo,
        roomInfo: room.roomInfo
      });
    } else {
      if (!this.waitRoom[zone]) {
        let rid = uuid();
        this.waitRoom[zone] = new Room(rid);
        this.rooms[rid] = this.waitRoom[zone];
      }
      let waitRoom = this.waitRoom[zone]
      console.log(this.waitRoom)
      this.cancelPlay({uid})
      waitRoom.joinRoom(uid);
      console.log('waitRoom', waitRoom)
      if (waitRoom.isFull()) {
        let serverGame = balance(userInfo, this.serverInfos)
        if (!serverGame) {
          this.connector.broadcast(uid, consts.ERROR.SERVER_NOT_FOUND);
          delete this.rooms[waitRoom.rid]
          this.waitRoom[zone] = null;
          return utils.invoke(cb, {});
        } else {
          waitRoom.serverInfo = serverGame
          this.connector.send(`${waitRoom.serverInfo.serverId}/${consts.EVENT.EVT_CREATE_ROOM}`, {
            rid: waitRoom.rid,
            extra: {
              map: zone,
              players: waitRoom.players
            }
          }, (err, roomInfo) => {
            this.createRoom(roomInfo);
          });
          this.waitRoom[zone] = null;
        }
      }
    }

    utils.invoke(cb, {});
  }

  createRoom(roomInfo, cb) {
    console.log("RoomInfo: ", roomInfo);
    let rid = roomInfo.rid;
    let room = this.rooms[rid];
    let playerInfos = [];
    if (room) {

      let uids = room.uids();
      for (let idx = 0; idx < uids.length; idx++) {
        let uid = uids[idx];
        playerInfos.push(this.playerInfos[uid]);
      }
      room.roomInfo = Object.assign(roomInfo, {playerInfos});
      let serverId = room.serverInfo.serverId
      for (let idx = 0; idx < uids.length; idx++) {
        let uid = uids[idx];

        this.players[uid] = rid;
        this.connector.broadcast(uid, {
          serverInfo: room.serverInfo,
          roomInfo: roomInfo
        });
      }
      this.serverInfos[serverId].countRooms++;
      this.serverInfos[serverId].countPlayers += 2;
      setTimeout(function (uids, rid) {
        for (let idx = 0; idx < uids.length; idx++) {
          let uid = uids[idx]
          let ridNow = this.players[uid];
          if (ridNow == rid) this.leaveGame({uid})
        }
      }.bind(this, uids, rid), consts.TIMEOUT_IN_ROOM)
    }
    return utils.invoke(cb);
  }

  joinGame(roomInfo = {}, cb) {
    let rid = roomInfo.rid;
    let uid = roomInfo.uid;
    if (rid && uid) {
      this.players[uid] = rid;
    }
    return utils.invoke(cb);
  }

  leaveGame(info = {}, cb) {
    let uid = info.uid;
    let rid = this.players[uid]
    if (uid && rid) {
      let room = this.rooms[rid];
      room.leaveRoom(uid)
      if (room.players.length == 0) {
        let serverId = room.serverInfo.serverId
        this.serverInfos[serverId].countRooms--;
        this.serverInfos[serverId].countPlayers -= 2;
        delete this.rooms[rid]
      }
      delete this.players[uid];
    }
  }
}

module.exports = LobbyApi;
