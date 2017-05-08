const User = require('../models/User');

var findByUsername = async (username) =>{
  return await User.findOne({
    where: {username: username}
  });
};

var create = async (username, password, secretKey) =>{
  return await User.create({
    username: username,
    password: password,
    secretKey: secretKey
  });
};

module.exports = {
  findByUsername: findByUsername,
  create: create
};