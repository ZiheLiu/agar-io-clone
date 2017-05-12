import config from './config'

let canvasContext = null;
let canvas = null;
let isKeyPress = [false,false,false,false,false];// up down left right

function Canvas(canvasELe, curWidth, curHeight) {
  canvas = canvasELe;
  canvasContext = canvas.getContext('2d');
  canvas.width = curWidth;
  canvas.height = curHeight;

  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);

}

function onKeyDown(event) {
  let key = event.which || event.keyCode;
  switch (key){
    case config.KEY_UP: isKeyPress[0] = true;break;
    case config.KEY_DOWN: isKeyPress[1] = true;break;
    case config.KEY_LEFT: isKeyPress[2] = true;break;
    case config.KEY_RIGHT: isKeyPress[3] = true;break;
  }
}
function onKeyUp(event) {
  let key = event.which || event.keyCode;
  switch (key){
    case config.KEY_UP: isKeyPress[0] = false;break;
    case config.KEY_DOWN: isKeyPress[1] = false;break;
    case config.KEY_LEFT: isKeyPress[2] = false;break;
    case config.KEY_RIGHT: isKeyPress[3] = false;break;
  }
  console.log('onKeyUp: ', key, "isKeyPress: ", isKeyPress);
}

function drawCircle(x, y, radius, color, username) {
  console.log(color);
  if(typeof color === 'string')
    canvasContext.fillStyle = color;
  else{
    canvasContext.strokeStyle = color.border;
    canvasContext.fillStyle = color.fill;
    canvasContext.lineWidth = config.BORDER_WIDTH;
  }
  canvasContext.beginPath();
  canvasContext.arc(x, y, radius, 0, 7);
  canvasContext.fill();
  if(typeof color === 'object')
    canvasContext.stroke();
  if(username) {
    canvasContext.font = config.FONT_STYLE;
    canvasContext.fillStyle = config.FONT_COLOR;
    canvasContext.textBaseline = 'middle';
    canvasContext.textAlign = 'center';
    canvasContext.fillText(username, x, y);
  }
}

function drawGrid(startX, endX, startY, endY) {
  canvasContext.strokeStyle = config.gridColor;
  canvasContext.beginPath();
  for(; startX <= endX; startX += config.gridLen) {
    canvasContext.moveTo(startX, 0);
    canvasContext.lineTo(startX, config.curHeight);
  }
  for(; startY <= endY;startY += config.gridLen) {
    canvasContext.moveTo(0, startY);
    canvasContext.lineTo(config.curWidth, startY);
  }
  canvasContext.stroke();
}

function drawLine(startX, startY, endX, endY) {
  canvasContext.strokeStyle = config.BORDER_COLOR;
  canvasContext.lineWidth = config.BORDER_WIDTH;
  canvasContext.lineJoin = 'round';
  canvasContext.lineCap = 'round';

  canvasContext.beginPath();
  canvasContext.moveTo(startX, startY);
  canvasContext.lineTo(endX, endY);
  canvasContext.stroke();
}

function clearCanvas() {
  canvas.width = config.curWidth;
  canvas.height = config.curHeight;

}

export default {
  Canvas: Canvas,
  drawCircle: drawCircle,
  drawGrid: drawGrid,
  clearCanvas: clearCanvas,
  drawLine: drawLine,

  isKeyPress: isKeyPress
}