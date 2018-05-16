'use strict';
const Handler = require('../interface/handlerInterface');
class Base extends Handler{
  constructor(connector, config){
    super();
    this.connector = connector;
  }
  addEvent(eventName){
    this.connector.regEv(eventName, this);
  }
}
module.exports = Base;