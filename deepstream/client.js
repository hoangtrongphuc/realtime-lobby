'use strict';
const deepstream = require('deepstream.io-client-js');
const ClientInterface = require('./clientInterface');

class Client extends ClientInterface {
  constructor(config) {
    super(config);
    this.deepstream = deepstream(config.addr);
  }

  login(cb) {
    if (this.config.authOpts) {
      this.deepstream.login(this.config.authOpts, cb);
    }
    else {
      this.deepstream.login(cb);
    }
    this.deepstream.on( 'error', function( msg, event, topic ){
      console.log( msg );
    });
  }

  pub(chanelName, data) {
    this.deepstream.event.emit(chanelName, data);
  }

  sub(chanelName, cb) {
    this.deepstream.event.subscribe(chanelName, (data) => {
      cb(data);
    });
  }

  provide(chanelName, cb) {
    this.deepstream.rpc.provide(chanelName, (data, rpcResponse) => {
      cb(data, (response) => {
        console.log("Response Data: ", chanelName, response);
        rpcResponse.send(response);
      });
    });
  }

  checkOnline(users, cb) {
    console.log('users', users)

    this.deepstream.presence.getAll([users], (usersCheck) => {
      console.log(usersCheck)
      cb(usersCheck)
    })
  }

  make(chanelName, data, cb) {
    this.deepstream.rpc.make(chanelName, data, (err, result) => {
      cb(err, result);
    });
  }

  presence(cb) {
    console.log('dkmmmm')
    this.deepstream.presence.subscribe(cb)
  }
  
  
  close(cb) {
    console.log('Close')
    this.deepstream.close()
  }
}
;

module.exports = Client;
