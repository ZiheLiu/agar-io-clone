// const sequelize = require('../middleware/orm/sequelizeOrm');
// const Sequelize = require('sequelize');
//
// var Session = sequelize.define('session', {
//   username: {
//     type: Sequelize.STRING(100)
//   },
//   sessionId: {
//     type: Sequelize.STRING(100),
//     primaryKey: true
//   }
// }, {
//   freezeTableName: true,
//   timestamps: false,
// });
//
// Session.sync().then(function () {
//   console.log("create session success");
// });
//
// module.exports = Session;