// const sequelize = require('../middleware/orm/sequelizeOrm');
// const Sequelize = require('sequelize');
//
// var User = sequelize.define('user', {
//   username: {
//     type: Sequelize.STRING(100),
//     primaryKey: true
//   },
//   password: Sequelize.STRING(100),
//   secretKey: Sequelize.STRING(100)
// }, {
//   freezeTableName: true,
//   timestamps: false,
// });
//
// User.sync().then(function () {
//   console.log("create user success");
// });
//
// module.exports = User;