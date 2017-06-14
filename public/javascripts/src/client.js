import config from './config';
import utils from './utils';
import Canvas from './canvas'

let socket = null;

$('#game-chat-input').on('keyup', function (event) {
  let key = event.which || event.keyCode;
  console.log('test', key)
  if(key === config.KEY_ENTER) {
    console.log(key, $('#game-chat-input').val())
    socket.emit('clientChat', config.player.username, $('#game-chat-input').val())
  }
})

$('#startButton').on('click', function () {
  config.player.username = $('#playerNameInput').val();
  console.log('user: [username]' + config.player.username + ' click start');

  //自动发送connection事件
  socket = io();
  socket.on('connect', function () {
    $('#startMenuWrapper').hide();
    $('#gameAreaWrapper').show();
    $('html').addClass('body-game');
    console.log('serverWelcome: [socket.id]' + socket.id);
    socket.emit('clientRequestLogin', config.player.username);

    initGame();
  });

  socket.on('serverMove', function (curPlayer, seenBlocks, seenFoods, sortPlayers, seenBarriers) {
    updatePlayerSortPanel(sortPlayers)
    config.player.x = curPlayer.x;
    config.player.y = curPlayer.y;

    config.originX = config.player.x - config.curWidth / 2;
    config.originY = config.player.y - config.curHeight / 2;

    Canvas.clearCanvas();
    drawGrid();

    for(let i = 0; i<seenFoods.length; i++) {
      drawFood(seenFoods[i]);
    }

    for(let i = 0; i<seenBarriers.length; i++) {
      drawBarrier(seenBarriers[i]);
    }

    seenBlocks.forEach(function (block) {
      drawPlayer(block);
    });

    $('#position').text(curPlayer.x.toFixed(2) + ", " + curPlayer.y.toFixed(2));
  });

  socket.on('serverDead', function () {
    console.log('serverDead');
    Canvas.clearCanvas();
    $('.game-dead').css('display', 'flex')
    // $('html').addClass('dead');
    window.cancelAnimFrame(config.animLoopHandle);
    config.animLoopHandle = null;
  });

  socket.on('serverChat', function(username, msg) {
    $('#game-chat-main').append($('<p></p>').text(`${username} >> ${msg}`))
    let curDiv = document.getElementById('game-chat-main')
    curDiv.scrollTop = curDiv.scrollHeight
  })
});

function updatePlayerSortPanel(sortPlayers) {
  let gameSortUl = $('#game-sort-ul')
  gameSortUl.children().remove()
  sortPlayers.forEach((username) => {
    gameSortUl.append($('<li></li>')
      .append($('<img src="../../images/user2.svg" alt="user" class="icon-sm">'))
      .append($('<span></span>').text(username)))
  })
}

function initGame() {
  config.curHeight = document.body.offsetHeight;
  config.curWidth = document.body.offsetWidth;
  Canvas.Canvas(document.getElementById("gameCanvas"), config.curWidth, config.curHeight);

  socket.emit('clientWindowResize', config.curWidth, config.curHeight);

  gameLoop();
}

window.onresize = function () {
  config.curHeight = document.body.offsetHeight
  config.curWidth = document.body.offsetWidth
  Canvas.setWidthHeight(config.curWidth, config.curHeight)
  socket.emit('clientWindowResize', config.curWidth, config.curHeight)
}

function drawGrid() {
  let startX = Math.ceil((config.player.x - config.curWidth/2)/config.gridLen)*config.gridLen - config.originX;
  let endX = Math.ceil((config.player.x + config.curWidth/2)/config.gridLen)*config.gridLen - config.originX;
  let startY = Math.ceil((config.player.y - config.curHeight/2)/config.gridLen)*config.gridLen - config.originY;
  let endY = Math.ceil((config.player.y + config.curHeight/2)/config.gridLen)*config.gridLen - config.originY;

  Canvas.drawGrid(startX, endX, startY, endY);

  if(config.player.y <= config.curHeight/2){
    startX = Math.max(0, config.player.x-config.curWidth/2) - config.originX;
    endX = Math.min(config.maxWidth, config.player.x + config.curWidth/2) - config.originX;
    startY = 0 - config.originY;
    Canvas.drawLine(startX, startY, endX, startY);
  }
  else if(config.player.y + config.curHeight/2 >= config.maxHeight){
    startX = Math.max(0, config.player.x-config.curWidth/2) - config.originX;
    endX = Math.min(config.maxWidth, config.player.x + config.curWidth/2) - config.originX;
    startY = config.maxHeight - config.originY;
    Canvas.drawLine(startX, startY, endX, startY);
  }

  if(config.player.x <= config.curWidth/2) {
    startY = Math.max(0, config.player.y-config.curHeight/2) - config.originY;
    endY = Math.min(config.maxHeight, config.player.y + config.curHeight/2) - config.originY;
    startX = 0 - config.originX;
    Canvas.drawLine(startX, startY, startX, endY);
  }
  else if(config.player.x + config.curWidth/2 >= config.maxWidth){
    startY = Math.max(0, config.player.y-config.curHeight/2) - config.originY;
    endY = Math.min(config.maxHeight, config.player.y + config.curHeight/2) - config.originY;
    startX = config.maxWidth - config.originX;
    Canvas.drawLine(startX, startY, startX, endY);
  }

}


function drawPlayer(player) {
  let position = utils.getCanvasXY(player.x, player.y);
  let minPos = utils.getCanvasXY(0, 0);
  let maxPos = utils.getCanvasXY(config.maxWidth, config.maxHeight);
  // Canvas.drawCircle(position.x, position.y, player.radius, player.color, player.username);
  Canvas.drawPlayer(position.x, position.y, player.radius, minPos.x, minPos.y, maxPos.x, maxPos, player.color, player.username)
}

function drawFood(food) {
  let position = utils.getCanvasXY(food.x, food.y);
  Canvas.drawCircle(position.x, position.y, food.radius, food.color);
}

function drawBarrier(barrier) {
  // let position = utils.getCanvasXY(barrier.x, barrier.y);
  // Canvas.drawCircle(position.x, position.y, barrier.radius, barrier.color);
  let position = utils.getCanvasXY(barrier.x, barrier.y);
  Canvas.drawBarrier(position.x, position.y, barrier.radius, barrier.color)
}

function gameLoopFun() {
  for(let i = 0; i<4; i++) {
    if(Canvas.isKeyPress[i]) {
      socket.emit('clientMove'+i);
    }
  }
  if(Canvas.isKeyPress[4]) {
    Canvas.isKeyPress[4] = false;
    socket.emit('clientSplit', Canvas.isKeyPress);
  }
}

window.requestAnimFrame = (function() {
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.msRequestAnimationFrame     ||
    function( callback ) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

window.cancelAnimFrame = (function(handle) {
  return  window.cancelAnimationFrame     ||
    window.mozCancelAnimationFrame;
})();

function gameLoop() {
  config.animLoopHandle = window.requestAnimFrame(gameLoop);
  gameLoopFun();
}

function pingLoop() {
  socket.emit('tryPing');
}

window.setInterval(pingLoop, config.PING_TIME);