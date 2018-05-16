'use strict';
const container = require('./container/container');
const consts = require('./utils/const');
const utils = require('./utils/utils');
let app = null;

class App {
  constructor(config = {}) {
    this.config = config;
  }

  start(cb) {
    // Init Network
    let network = container.network(this.config.network);
    network.login((err, data) => {
      container.connector(container.network(), this.config.connector);
      container.lobby(container.connector(), this.config.lobby);
      container.lobby().init();
      utils.invoke(cb, err, data)
    });
  }

  startGame(cb) {
    let network = container.network(this.config.network);
    network.login((err, data) => {
      container.connector(container.network(), this.config.connector);
      container.game(container.connector(), this.config.game);
      utils.invoke(cb, err, data)
    });
  }

  startClient(cb) {
    let network = container.network(this.config.network);
    network.login((err, data) => {
      container.connector(container.network(), this.config.connector);
      utils.invoke(cb, err, data)
    });
  }

  bind(uid, handler) {
    container.connector().regEv(uid, handler);
  }

  unbind(uid) {
    container.connector().removeEv(uid, handler);
  }

  playnow(info, cb) {
    container.connector().send(consts.EVENT.EVT_PLAYNOW, info, (err, data) => {
      cb(err, data);
    });
  }

  checkRoom(info, cb) {
    container.connector().send(consts.EVENT.EVT_CHECK_ROOM, info, (err, data) => {
      cb(err, data);
    });
  }

  playCoop(info, cb) {
    container.connector().send(consts.EVENT.EVT_PLAY_COOP, info, (err, data) => {
      cb(err, data);
    });
  }
}
process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
module.exports = {
  app: function () {
    return app;
  },
  startLobby: function (config, cb) {
    if (!app) {
      app = new App(config);
    }
    app.start();
    return app;
  },
  startGame: function (config, cb) {
    if (!app) {
      app = new App(config);
    }
    app.startGame(cb);
    return app;
  },
  startClient: function (config, cb) {
    if (!app) {
      app = new App(config);
    }
    app.startClient(cb);
    return app;
  }
};