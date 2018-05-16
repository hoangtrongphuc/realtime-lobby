'use strict';
const Game = require('../logic/game');
const Network = require('../deepstream/client');
const Connector = require('../connector/connector');
const Lobby = require('../handler/lobby');
let g_Game = null;
let g_Network = null;
let g_Connector = null;
let g_Lobby = null;

module.exports = {
  game: function(connector, config){
    if (!g_Game){
      g_Game = new Game(connector, config);
    }
    return g_Game;
  },
  lobby: function(config){
    if (!g_Lobby){
      g_Lobby = new Lobby(config);
    }
    return g_Lobby;
  },
  network: function(config){
    if (!g_Network){
      g_Network = new Network(config);
    }
    return g_Network;
  },
  connector: function(config){
    if (!g_Connector){
      g_Connector = new Connector(config);
    }
    return g_Connector
  }
};