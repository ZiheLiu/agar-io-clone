module.exports = {
  maxHeight: 5000,
  maxWidth: 5000,
  curHeight: 0,
  curWidth: 0,

  initQuality: 1400,
  minQualityOfSplit: 10000,
  unionRotate: 3/4,
  initForce: 200,
  initGarvity: 5000,
  initBeishu: 30,

  splitFrame: 20,
  splitDis: 10,

  sortLimit: 10,

  eatPlayerRotate: 1.25,
  eatPlayerRadiusRotate: 3/4,

  limitBarriers: 100,
  barrierQuality: 3000,
  splitDirection: [[true, true, false, false], [true, false, false, true],
    [false, false, true, true], [false, true, true, false]],
  barrierSplitFrame: 10,

  foodQuality: 500,
  limitFoods: 500,
  eatRotate: 3/4,

  frameNum: 60,
  kickNum: 600
};