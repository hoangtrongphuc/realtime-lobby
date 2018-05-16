'use strict';
const Handler = require('./handlerInterface');
class Client extends Handler{
  constructor(){}
  onEvent(eventName, data, cb){
    this.onJoinRoom(data);
    if (cb)
      cb();
  }
  onJoinRoom(data){};
}
module.exports = Client;