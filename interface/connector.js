'use strict';
class Connector {
  constructor(){}
  regEv(eventName, handler){}
  removeEv(eventName, handler){}
  broadcast(eventName, data){}
  send(eventName, data, cb){}
}
module.exports = Connector;