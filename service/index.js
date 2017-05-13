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
        color: utils.getRandomColor(),
        disSendAndReceive: 0
      };
      setPlayerQuality(curPlayer, config.initQuality);

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
      player.y = Math.max(0, player.y - player.velocity);
      player.disSendAndReceive = 0;
    });
    socket.on('clientMove1', function () {
      let player = socket.player;
      player.y = Math.min(config.maxHeight, player.y + player.velocity);
    });
    socket.on('clientMove2', function () {
      let player = socket.player;
      player.x = Math.max(0, player.x - player.velocity);
    });
    socket.on('clientMove3', function () {
      let player = socket.player;
      player.x = Math.min(config.maxWidth, player.x + player.velocity);
    });

    socket.on('ping', function () {
      let player = socket.player;
      player.disSendAndReceive = 0;
    });

  });

  setInterval(gameLoop, 1000 / config.frameNum);
}

function gameLoop() {

  if(foods.length < config.limitFoods) {
    let pos = utils.getRandomPosition(0, 0, config.maxWidth, config.maxHeight);
    foods.push({
      x: pos.x,
      y: pos.y,
      quality: config.foodQuality,
      radius: utils.getRadiusByQuality(config.foodQuality),
      color: utils.getRandomColor().fill
    });
  }

  players.sort(function (player1, player2) {
    return player1.radius > player2.radius || player1.username < player2.username;
  });

  for(let j=0, player;player=players[j];){
    if(player.disSendAndReceive >= config.kickNum) {
      console.log('kick: ', player);
      playerToSockets[player.socketId].disconnect();
      players.splice(j, 1);
      continue;
    }
    ++ j;
    ++ player.disSendAndReceive;


    for(let i=0, food;food=foods[i];) {
      if(utils.get2PointDistance(food.x, food.y, player.x, player.y) <= player.radius - food.radius*config.eatRotate) {
        foods.splice(i,1);
        setPlayerQuality(player, player.quality + food.quality);
      }
      else
        ++ i;
    }

    let seenPlayers = players.filter(function (otherPlayer) {
      return (otherPlayer.x + otherPlayer.radius >= player.x - config.curWidth/2 &&
        otherPlayer.x - otherPlayer.radius <= player.x + config.curWidth/2) &&
        (otherPlayer.y + otherPlayer.radius >= player.y - config.curHeight/2 &&
        otherPlayer.y - otherPlayer.radius <= player.y + config.curHeight/2);
    });

    let seenFoods = foods.filter(function (food) {
      return (food.x + food.radius >= player.x - config.curWidth/2 &&
        food.x - food.radius <= player.x + config.curWidth/2) &&
        (food.y + food.radius >= player.y - config.curHeight/2 &&
        food.y - food.radius <= player.y + config.curHeight/2);
    });

    playerToSockets[player.socketId].emit('serverMove', player, seenPlayers, seenFoods);
  }
}

function setPlayerQuality(player, quality) {
  player.quality = quality;
  player.radius = utils.getRadiusByQuality(quality);
  player.velocity = utils.getVelocityByQuality(config.initForce, quality);
  console.log(player.velocity);
}

module.exports = buildServer;