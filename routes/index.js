const router = require('koa-router')();
const User = require('../models/User');
const authority = require('../middleware/authority');

router.get('/', async (ctx, next)=> {
  // ctx.body = 'this is a INDEX!'
  await ctx.render('index');
});

module.exports = router;
