const config = require('../config');
const utils = require('./utils');

let players = [];
let playerToSockets = {};
let foods = [];
let barriers = [];

function buildServer(server) {
  //建立socket.io
  let io = require('socket.io')(server);

  //
  io.on('connection', function(socket){
    console.log('connection [socket.id]' + socket.id);

    socket.on('clientRequestLogin', function(username){
      console.log('clientRequestLogin: [username]' + username);

      io.sockets.emit('serverChat', 'system', `${username} join`)

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

    socket.on('clientChat', function(username, msg){
      io.sockets.emit('serverChat', username, msg)
    })

    socket.on('clientWindowResize', function (x, y) {
      config.curWidth = x;
      config.curHeight = y;
    });

    socket.on('clientMove0', function () {
      let player = socket.player;
      player.blocks.forEach(function (block) {
        block.y = Math.max(0, block.y - block.velocity );
      });
      player.y = Math.max(0, player.y - player.velocity);
      player.disSendAndReceive = 0;
    });
    socket.on('clientMove1', function () {
      let player = socket.player;
      player.blocks.forEach(function (block) {
        block.y = Math.min(config.maxHeight, block.y + block.velocity );
      });
      player.y = Math.min(config.maxHeight, player.y + player.velocity);
    });
    socket.on('clientMove2', function () {
      let player = socket.player;
      player.blocks.forEach(function (block) {
        block.x = Math.max(0, block.x - block.velocity );
      });
      player.x = Math.max(0, player.x - player.velocity);
    });
    socket.on('clientMove3', function () {
      let player = socket.player;
      player.blocks.forEach(function (block) {
        block.x = Math.min(config.maxWidth, block.x + block.velocity );
      });
      player.x = Math.min(config.maxWidth, player.x + player.velocity);
    });

    socket.on('clientSplit', function (isKeyPress) {
      let player = socket.player;
      let blockLen = player.blocks.length;
      let block = null;
      for(let i=0;i<blockLen;i++) {
        block = player.blocks[i];
        if (block.quality >= config.minQualityOfSplit) {
          setPlayerQuality(block, block.quality / 2);
          let curBlock = {
            color: player.color,
            username: player.username,
            x: block.x,
            y: block.y
          };
          setPlayerQuality(curBlock, block.quality);

          curBlock.isSpliting = true
          curBlock.splitData = {
            isKeyPress: isKeyPress,
            leftFrame: config.splitFrame
          }

          player.blocks.push(curBlock);

          setPlayerVelocity(player);
        }
      }
    });

    socket.on('tryPing', function () {
      let player = socket.player;
      player.disSendAndReceive = 0;
    });

  });

  setInterval(gameLoop, 1000 / config.frameNum);
}

function gameLoop() {
  //如果食物数量没有达到上线，增加食物
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

  //如果尖刺数目没有达到上线，增加尖刺
  if(barriers.length < config.limitBarriers) {
    let pos = utils.getRandomPosition(0, 0, config.maxWidth, config.maxHeight)
    barriers.push({
      x: pos.x,
      y: pos.y,
      quality: config.barrierQuality,
      radius: utils.getRadiusByQuality(config.barrierQuality),
      color: utils.getRandomColor()
    })
  }

  players.sort((player, player2) => {
    return player.quality < player2.quality
  })
  let sortPlayers = []
  for (let i = 0; i < players.length && i < config.sortLimit; i++) {
    sortPlayers.push(players[i].username)
  }


  for(let j=0, player;player=players[j];){
    //kick current user
    if(player.disSendAndReceive >= config.kickNum) {
      console.log('kick: ', player);
      playerToSockets[player.socketId].disconnect();
      players.splice(j, 1);
      continue;
    }
    ++ j;
    ++ player.disSendAndReceive;

    player.blocks.forEach((block) => {
      if (block.isSpliting) {
        if (block.splitData.isKeyPress[0])
          block.y = Math.max(0, block.y - config.splitDis);
        if (block.splitData.isKeyPress[2])
          block.y = Math.min(config.maxHeight, block.y + config.splitDis);
        if (block.splitData.isKeyPress[1])
          block.x = Math.max(0, block.x - config.splitDis);
        if (block.splitData.isKeyPress[3])
          block.x = Math.min(config.maxWidth, block.x + config.splitDis);
        block.splitData.leftFrame --
        if (block.splitData.leftFrame === 0) {
          block.isSpliting = false
        }
      }
    })

    //eat food
    player.blocks.forEach(function (block) {
      for(let i=0, food;food=foods[i];) {
        if(utils.get2PointDistance(food.x, food.y, block.x, block.y) <= block.radius - food.radius*config.eatRotate) {
          foods.splice(i, 1);
          addBlockQuality(block, food.quality, player);
        }
        else
          ++ i;
      }
    });

    // meet barrier
    let blocksLen = player.blocks.length
    for(let i = 0, block=player.blocks[0]; i < blocksLen; block = player.blocks[i], i++) {
      barriers.forEach((barrier) => {
        if (barrier.quality < block.quality &&
          utils.get2PointDistance(barrier.x, barrier.y, block.x, block.y) <= block.radius - barrier.radius*config.eatRotate) {

          setPlayerQuality(block, block.quality / 4);
          block.isSpliting = true
          block.splitData = {
            isKeyPress: config.splitDirection[3],
            leftFrame: config.barrierSplitFrame
          }

          for (let i = 0; i < 3; i++) {
            let curBlock = {
              color: player.color,
              username: player.username,
              x: block.x,
              y: block.y
            };
            setPlayerQuality(curBlock, block.quality);

            curBlock.isSpliting = true
            curBlock.splitData = {
              isKeyPress: config.splitDirection[i],
              leftFrame: config.barrierSplitFrame
            }

            player.blocks.push(curBlock);
          }

          setPlayerVelocity(player);

        }
      })
    }

    //eat other player
    player.blocks.forEach(function (block) {
      for(let i=0, otherPlayer;otherPlayer=players[i];) {
        if(otherPlayer.socketId === player.socketId) {
           ++i;
          continue;
        }

        for(let k=0, otherBlock;otherBlock=otherPlayer.blocks[k];) {
          if(otherBlock.quality*config.eatPlayerRotate<=block.quality &&
          utils.get2PointDistance(otherBlock.x, otherBlock.y, block.x, block.y)<=block.radius - otherBlock.radius*config.eatPlayerRadiusRotate) {
            addBlockQuality(block, otherBlock.quality, player);
            otherPlayer.quality -= otherBlock.quality;
            otherPlayer.blocks.splice(k, 1);
          }
          else
            ++ k;
        }
        if(otherPlayer.blocks.length===0) {
          console.log('dead: ', otherPlayer);
          players.splice(i, 1);
          playerToSockets[otherPlayer.socketId].emit('serverDead');
        }
        else{
          setPlayerVelocity(otherPlayer);
          i++;
        }
      }
    });


    //union blocks
    player.blocks.sort(function (block1, block2) {
      return block1.quality < block2.quality;
    });
    for(let i=0, block;block=player.blocks[i];i++) {
      for(let k=i+1, block2;block2=player.blocks[k];) {
        if(!block.isSpliting && !block2.isSpliting &&
          utils.get2PointDistance(block.x, block.y, block2.x, block2.y)<=block.radius-block2.radius*config.unionRotate) {
          addBlockQuality(block, block2.quality, player, true);
          player.blocks.splice(k, 1);
        }
        else
          ++ k;
      }
    }
    if(player.blocks.length===1) {
      player.x = player.blocks[0].x;
      player.y = player.blocks[0].y;
    }

    //calculate seen blocks
    let seenBlocks = [];
    players.forEach(function (otherPlayer) {
      otherPlayer.blocks.forEach(function (block) {
        if(block.x + block.radius >= player.x - config.curWidth/2 &&
          block.x - block.radius <= player.x + config.curWidth/2 &&
          block.y + block.radius >= player.y - config.curHeight/2 &&
          block.y - block.radius <= player.y + config.curHeight/2)

          seenBlocks.push(block);
      })
    });
    seenBlocks.sort(function (block1, block2) {
      return block1.quality > block2.quality;
    });

    //calculate seen foods
    let seenFoods = foods.filter(function (food) {
      return (food.x + food.radius >= player.x - config.curWidth/2 &&
        food.x - food.radius <= player.x + config.curWidth/2) &&
        (food.y + food.radius >= player.y - config.curHeight/2 &&
        food.y - food.radius <= player.y + config.curHeight/2);
    });

    //calculate seen barrier
    let seenBarriers = barriers.filter(function (barrier) {
      return (barrier.x + barrier.radius >= player.x - config.curWidth/2 &&
        barrier.x - barrier.radius <= player.x + config.curWidth/2) &&
        (barrier.y + barrier.radius >= player.y - config.curHeight/2 &&
        barrier.y - barrier.radius <= player.y + config.curHeight/2);
    });

    playerToSockets[player.socketId].emit('serverMove', player, seenBlocks, seenFoods, sortPlayers, seenBarriers);
  }
}

function setPlayerQuality(player, quality) {
  player.quality = quality;
  player.velocity = utils.getVelocityByQuality(config.initForce, quality);
  player.radius = utils.getRadiusByQuality(quality);
}

function setPlayerVelocity(player) {
  let velocity = 999;
  player.blocks.forEach(function (block) {
    velocity = Math.min(velocity, block.velocity);
  });
  player.velocity = velocity;
}

function getBlockGravitVelocity(block, player) {
  let disSquare = (block.x - player.x) * (block.x - player.x) + (block.y - player.y) * (block.y - player.y);
  if(disSquare<=0.00001)
    return 0;
  return config.initGarvity / disSquare;
}

function addBlockQuality(block, quality, player, isUnion) {
  setPlayerQuality(block, block.quality + quality);
  if(!isUnion)
    player.quality += quality;
  setPlayerVelocity(player);
}


module.exports = buildServer;