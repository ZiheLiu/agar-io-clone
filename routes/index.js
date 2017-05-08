const router = require('koa-router')();
const User = require('../models/User');
const authority = require('../middleware/authority');

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello ' + ctx.state.user
  })
});

router.post('/login', async (ctx, next) => {
  let username = ctx.request.body.username || '';
  let password = ctx.request.body.password || '';
  console.log("login: ", username, password);
  let checkLogin = await authority.checkLogin(username, password, ctx);
  ctx.body = {
    'state': checkLogin ? 0 : 1
  };
});

router.post('/register', async (ctx, next) => {
  let username = ctx.request.body.username || '';
  let password = ctx.request.body.password || '';
  console.log("register: ", username, password);
  let register = await authority.register(username, password);
  ctx.body = {
    'state': register ? 0 : 1
  }
});

router.post('/logout', async (ctx, next) => {
  await authority.logout(ctx);
  ctx.body = {
    'state': 0
  }
});

module.exports = router;
