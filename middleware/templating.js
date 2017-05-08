const nunjucks = require('nunjucks');

function createEnv(path, opts) {
  var autoescape = opts.autoescape === undefined ? true : opts.autoescape;
  var noCache = opts.noCache || false;
  var watch = opts.watch || false;
  var throwOnUndefined = opts.throwOnUndefined || false;
  var env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(path||'views',
      {
        noCache:noCache,
        watch:watch
      }),
    {
      autoescape: autoescape,
      throwOnUndefined: throwOnUndefined
    }
  );
  if(opts.filters) {
    for(var filter in opts.filters) {
      env.addFilter(filter, opts.filters[filter]);
    }
  }
  return env;
}

function templating(path, opts) {
  return createEnv(path, opts);
}

module.exports = createEnv;