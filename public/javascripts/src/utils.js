import config from './config';

function getCanvasXY(x, y) {
  // let originX = config.player.x - config.curWidth / 2;
  // let originY = config.player.y - config.curHeight / 2;
  return {
    x: x - config.originX,
    y: y- config.originY
  }
}


export default {
  getCanvasXY: getCanvasXY
};