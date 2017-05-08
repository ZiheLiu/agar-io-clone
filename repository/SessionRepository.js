const Session = require('../models/Session');

let findBySessionId = async(sessionId) => {
  return await Session.findOne({where: {sessionId: sessionId}});
};

let create = async (sessionId, username) =>{
  return await Session.create({
    sessionId: sessionId,
    username: username
  });
};

let deleteSession = async (sessionId) => {
  let  curSession= await Session.findOne({where: {sessionId: sessionId}});
  await curSession.destroy();
  return true;
};

module.exports = {
  create: create,
  findBySessionId: findBySessionId,
  deleteSession: deleteSession
};