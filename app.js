const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');

const index = require('./routes/index');
const users = require('./routes/users');

const templating = require('./middleware/templating');
const authority = require('./middleware/authority');

const User = require('./models/User');

const isProduction = process.env.NODE_ENV === 'production';

// error handler
onerror(app);

// middlewares
app.use(bodyparser);
app.use(json());
app.use(logger());
app.use(require('koa-static')(__dirname + '/public'));


app.use(views(__dirname + '/views', {
  options: {
    nunjucksEnv: templating('views', {
      noCache: !isProduction,
      watch: !isProduction
    })
  },
  map: {html: 'nunjucks'}
}));

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

app.use(authority.authority());

//models


// routes
app.use(index.routes(), index.allowedMethods());
app.use(users.routes(), users.allowedMethods());



module.exports = app;
