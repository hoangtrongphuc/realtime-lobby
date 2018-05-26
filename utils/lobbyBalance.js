'use strict';
let roomCounter = 0;
const consts = require('./const')

module.exports = {
  balance: function (userInfo, servers) {
	let serversUse = {};
    for (let serverId in servers) {
      if (servers.hasOwnProperty(serverId)) {
        let server = servers[serverId]
        if (server.countPlayers >= server.maxPlayers || server.countRooms >= server.maxRooms) return
        else serversUse[serverId] = server
      }
    }

    let serverIds = Object.keys(serversUse);
    let index = roomCounter % serverIds.length;
    if (serversUse[serverIds[index]]) {
      roomCounter++;
      return serversUse[serverIds[index]];
    } else return null;
  }


};
