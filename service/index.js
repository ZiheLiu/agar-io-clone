const config = require('../config');
const utils = require('./utils');

let players = [];
let playerToSockets = {};
let foods = [];

function buildServer(server) {
  let io = require('socket.io')(server);

  io.on('connection', function(socket){
    console.log('connection [socket.id]' + socket.id);

    socket.on('clientRequestLogin', function(username){
      console.log('clientRequestLogin: [username]' + username);

      let curPlayer = {
        username: username,
        socketId: socket.id,
        x: config.maxWidth/2,
        y: config.maxHeight/2,
        radius: config.initRadius,
        color: utils.getRandomColor()
      };
      socket.player = curPlayer;
      players.push(curPlayer);
      playerToSockets[socket.id] = socket;
    });

    socket.on('clientWindowResize', function (x, y) {
      config.curWidth = x;
      config.curHeight = y;
    });

    socket.on('clientMove0', function () {
      let player = socket.player;
      player.y = Math.max(0, player.y - config.step);
    });
    socket.on('clientMove1', function () {
      let player = socket.player;
      player.y = Math.min(config.maxHeight, player.y + config.step);
    });
    socket.on('clientMove2', function () {
      let player = socket.player;
      player.x = Math.max(0, player.x - config.step);
    });
    socket.on('clientMove3', function () {
      let player = socket.player;
      player.x = Math.min(config.maxWidth, player.x + config.step);
    });
  });

  setInterval(gameLoop, 1000 / config.frameNum);
}

function gameLoop() {

  if(foods.length < config.limitFoods) {
    let pos = utils.getRandomPosition(0, 0, config.maxWidth, config.maxHeight)
    foods.push({
      x: pos.x,
      y: pos.y,
      color: utils.getRandomColor().fill
    })
  }

  players.forEach(function (player) {

    players.sort(function (player1, player2) {
      return player1.radius < player2.radius || player1.username < player2.username;
    });

    let seenPlayers = players.filter(function (otherPlayer) {
      console.log('other player', otherPlayer.x, otherPlayer.y);
      console.log('window size', config.curWidth, config.curHeight);
      return (otherPlayer.x + otherPlayer.radius >= player.x - config.curWidth/2 &&
        otherPlayer.x - otherPlayer.radius <= player.x + config.curWidth/2) &&
        (otherPlayer.y + otherPlayer.radius >= player.y - config.curHeight/2 &&
        otherPlayer.y - otherPlayer.radius <= player.y + config.curHeight/2);
    });

    playerToSockets[player.socketId].emit('serverMove', player, seenPlayers);
  });
}

module.exports = buildServer;