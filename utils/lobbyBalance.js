'use strict';
let roomCounter = 0;
const consts = require('./const')

module.exports = {
  balance: function (userInfo, servers) {
	let serverIds = Object.keys(servers);
    let index = roomCounter % serverIds.length;
    roomCounter++;
    console.log(index, servers);
    return servers[serverIds[index]];
  }


};