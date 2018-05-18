'use strict';
class ClientInterface {
  constructor(config){
    this.config = config;
  }
  login(authConfig, cb){}
  pub(chanelName, data){}
  sub(chanelName, cb){}
  provide(chanel, cb){}
  make(chanel, data, cb){}
  presence(chanel, data, cb){}
  close(cb) {
  }
}

module.exports = ClientInterface;
