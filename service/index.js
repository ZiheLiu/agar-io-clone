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

      let color  = utils.getRandomColor();
      let curPlayer = {
        username: username,
        socketId: socket.id,
        color: color,
        disSendAndReceive: 0,

        //center
        x: config.maxWidth/2,
        y: config.maxHeight/2,
        quality: config.initQuality,
        velocity: utils.getVelocityByQuality(config.initForce, config.initQuality),

        //blocks
        blocks: [{
          x: config.maxWidth/2,
          y: config.maxHeight/2,
          color: color,
          username: username
        }],

      };
      setPlayerQuality(curPlayer.blocks[0], config.initQuality);

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
      player.blocks.forEach(function (block) {
        block.y = Math.max(0, block.y - block.velocity);
      });
      player.y = Math.max(0, player.y - player.velocity);
      player.disSendAndReceive = 0;
    });
    socket.on('clientMove1', function () {
      let player = socket.player;
      player.blocks.forEach(function (block) {
        block.y = Math.min(config.maxHeight, block.y + block.velocity);
      });
      player.y = Math.min(config.maxHeight, player.y + player.velocity);
    });
    socket.on('clientMove2', function () {
      let player = socket.player;
      player.blocks.forEach(function (block) {
        block.x = Math.max(0, block.x - block.velocity);
      });
      player.x = Math.max(0, player.x - player.velocity);
    });
    socket.on('clientMove3', function () {
      let player = socket.player;
      player.blocks.forEach(function (block) {
        block.x = Math.min(config.maxWidth, block.x + block.velocity);
      });
      player.x = Math.min(config.maxWidth, player.x + player.velocity);
      console.log('clientMove3', player);
    });

    socket.on('clientSplit', function (isKeyPress) {
      let player = socket.player;
      let blockLen = player.blocks.length;
      let block = null;
      for(let i=0;i<blockLen;i++) {
        block = player.blocks[i];
        if (block.quality >= config.minQualityOfSplit) {
          block.x = Math.min(config.maxWidth, block.x + block.radius * 2);
          setPlayerQuality(block, block.quality / 2);
          let curBlock = {
            color: player.color,
            username: player.username,
            x: Math.min(config.maxWidth, block.x - block.radius * 2),
            y: block.y
          };
          block.x = Math.min(config.maxWidth, block.x + block.radius * 2);
          setPlayerQuality(curBlock, block.quality);

          if (isKeyPress[0])
            curBlock.y = Math.max(0, curBlock.y - curBlock.velocity);
          else if (isKeyPress[1])
            curBlock.y = Math.min(config.maxHeight, curBlock.y + curBlock.velocity);
          if (isKeyPress[2])
            curBlock.x = Math.max(0, curBlock.x - curBlock.velocity);
          else if (isKeyPress[3])
            curBlock.x = Math.min(config.maxWidth, curBlock.x + curBlock.velocity);

          player.blocks.push(curBlock);

          setPlayerVelocity(player);
          // player.velocity = Math.min(player.velocity, block.velocity);
        }
      }
      console.log('clientSplit', player.username, isKeyPress);
    });

    socket.on('tryPing', function () {
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
    return player1.quality > player2.quality || player1.username < player2.username;
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

    player.blocks.forEach(function (block) {
      for(let i=0, food;food=foods[i];) {
        if(utils.get2PointDistance(food.x, food.y, block.x, block.y) <= block.radius - food.radius*config.eatRotate) {
          foods.splice(i, 1);
          setPlayerQuality(block, block.quality + food.quality);
          player.quality += food.quality;
          setPlayerVelocity(player);
        }
        else
          ++ i;
      }
    });

    let seenBlocks = player.blocks.slice(0, player.blocks.length);
    players.filter(function (otherPlayer) {
      otherPlayer.blocks.forEach(function (block) {
        if(block.x + block.radius >= player.x - config.curWidth/2 &&
          block.x - block.radius <= player.x + config.curWidth/2 &&
          block.y + block.radius >= player.y - config.curHeight/2 &&
          block.y - block.radius <= player.y + config.curHeight/2)

          seenBlocks.push(block);
      })
    });

    let seenFoods = foods.filter(function (food) {
      return (food.x + food.radius >= player.x - config.curWidth/2 &&
        food.x - food.radius <= player.x + config.curWidth/2) &&
        (food.y + food.radius >= player.y - config.curHeight/2 &&
        food.y - food.radius <= player.y + config.curHeight/2);
    });

    playerToSockets[player.socketId].emit('serverMove', player, seenBlocks, seenFoods);
  }
}

function setPlayerQuality(player, quality) {
  player.quality = quality;
  player.velocity = utils.getVelocityByQuality(config.initForce, quality);
  player.radius = utils.getRadiusByQuality(quality);
  console.log(player.velocity);
}

function setPlayerVelocity(player) {
  let velocity = 999;
  player.blocks.forEach(function (block) {
    velocity = Math.min(velocity, block.velocity);
  });
  player.velocity = velocity;
}

module.exports = buildServer;