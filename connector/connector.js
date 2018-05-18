'use strict';
const Promise = require('bluebird');
const Interface = require('../interface/connector');
const utils = require('../utils/utils');
class Connector extends Interface {
  constructor(network, config) {
    super();
    this.handlers = {};
    this.netClient = network;
    console.log("Init Connector");
  }

  close(cb) {
    this.netClient.close(cb);
  }
  
  regEv(eventName, handler) {
    console.log("RegEv: ", eventName);
    let handlers = this.handlers[eventName];
    if (!handlers) {
      this.handlers[eventName] = [];
      handlers = this.handlers[eventName];
      this.initEvent(eventName);
    }
    if (handlers.indexOf(handler) != -1) return;
    handlers.push(handler);

  }

  removeEv(eventName, handler) {
    let handlers = this.handlers[eventName];
    let pos = handlers.indexOf(handler);
    if (pos != -1) return;
    handlers.splice(pos, 1);
  }

  broadcast(eventName, data) {
    this.netClient.pub(eventName, data);
  }

  presence(cb) {
    this.netClient.presence(cb);
  }

  send(eventName, data, cb) {
    this.netClient.make(eventName, data, cb);
  }

  checkOnline(user, cb) {
    this.netClient.checkOnline(user, data => {
      console.log('data', data)
      cb(data[user])
    });
  }

  initEvent(eventName) {
    this.netClient.sub(eventName, (data) => {
      this.doHandle(eventName, data);
    });
    this.netClient.provide(eventName, (data, done) => {
      this.doHandle(eventName, data, done);
    });
  }

  doHandle(eventName, data, cb) {
    let handlers = this.handlers[eventName] || [];
    if (handlers.length == 0) {
      return utils.invoke(cb);
    }
    if (cb) {
      handlers[0].onEvent(eventName, data, cb);
    }
    else {
      for (let idx = 0; idx < handlers.length; idx++) {
        handlers[idx].onEvent(eventName, data);
      }
    }
  }
}

module.exports = Connector;
