const Cookies = require('cookies');
const crypto = require('crypto');

const User = require('../models/User');
const Session = require('../models/Session');
const SessionRepository = require('../repository/SessionRepository');
const UserRepository = require('../repository/UserRepository');

var config = {
  loginUrl: '/login',
  allowAllUrl: ['/register']
};

async function parseUser(obj) {
  if(!obj) {
    return;
  }
  let sessionId = '';
  if(typeof obj==='string')
    sessionId = obj;
  else if(obj.headers) {
    let cookies = new Cookies(obj, null);
    sessionId = cookies.get('sessionId');
  }
  let curSession = await SessionRepository.findBySessionId(sessionId);

  if(curSession) {
    return curSession.get('username');
  }
  return null;
}

function isAllowedUrl(urlString) {
  if(urlString===config.loginUrl)
    return true;
  for(let i = 0;i<config.allowAllUrl.length;i++) {
    if(urlString===config.allowAllUrl[i])
      return true;
  }
  return false;
}

function authority() {
  return async (ctx, next) => {
    if(isAllowedUrl(ctx.request.path)){
      await next();
    }
    else{
      let userString = await parseUser(ctx);

      if(userString){
        ctx.state.user = userString;
        await next();
      }
      else{
        ctx.body = {
          'state': 2
        };
      }
    }
  };
}

function randomString(len) {
  len = len || 32;
  var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var maxPos = $chars.length;
  var pwd = '';
  for (let i = 0; i < len; i++) {
    //0~32的整数
    pwd += $chars.charAt(Math.floor(Math.random() * (maxPos+1)));
  }
  return pwd;
}

function persistSession(username, ctx) {
  var randomStr = randomString();
  const md5Hash = crypto.createHash('md5');
  md5Hash.update(randomStr);
  var hashSessionId = md5Hash.digest('hex');
  SessionRepository.create(hashSessionId, username);
  ctx.cookies.set('sessionId', hashSessionId);
  return hashSessionId;
}

async function checkLogin(username, password, ctx) {
  var user = await UserRepository.findByUsername(username);
  if(!user)
    return false;
  const hmac = crypto.createHmac('sha256', user.get('secretKey'));
  hmac.update(password);
  var hmacPassword = hmac.digest('hex');
  if(hmacPassword===user.get('password')){
    persistSession(username, ctx);
    return true;
  }
  return false;
}

async function logout(ctx) {
  ctx.state.user = '';
  await SessionRepository.deleteSession(ctx.cookies.get('sessionId'));
  ctx.cookies.set('sessionId', '');
}

async function register(username, password) {
  let randomStr = randomString(10);
  let secretKey = randomStr + username;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(password);
  let hmacPassword = hmac.digest('hex');
  await UserRepository.create(username, hmacPassword, secretKey);
  return true;
}

module.exports ={
  authority: authority,
  checkLogin: checkLogin,
  register: register,
  logout: logout
};