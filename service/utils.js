module.exports = {
  getRandomColor: function () {
    let color = '#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6);
    let c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    let r = parseInt(c[1], 16) - 32 > 0 ? parseInt(c[1], 16) - 32 : 0;
    let g = parseInt(c[2], 16) - 32 > 0 ? parseInt(c[2], 16) - 32 : 0;
    let b = parseInt(c[3], 16) - 32 > 0 ? parseInt(c[3], 16) - 32 : 0;

    return {
      fill: color,
      border: '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    };
  },

  getRandomPosition: function (x, y, x2, y2) {
    return {
      x: Math.random()*(x2-x) + x,
      y: Math.random()*(y2-y) + y
    }
  },

  getRadiusByQuality: function (quality) {
    return Math.sqrt(quality / Math.PI);
  },

  getVelocityByQuality: function (force, quality) {
    // return Math.sqrt(force/quality);
    return force/ Math.sqrt(quality);
  },

  get2PointDistance: function (x, y, x2, y2) {
    return Math.sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2));
  }
};