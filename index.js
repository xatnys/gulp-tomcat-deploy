var through = require('through2');
var gutil = require('gulp-util');
var http = require('http');
var assign = Object.assign || require('object.assign');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-tomcat-deploy';

function gulpTomcatDeploy (options) {

  options = assign({
    username: '',
    password: '',
    host: 'localhost',
    port: 8080,
    context: '/app',
    update: true,
    deployUrl: '/manager/text/deploy'
  }, options);


  var _http_options = {
    auth: [ options.username, options.password ].join(':'),
    host: options.host,
    port: options.port,
    context: options.context,
    path: (options.deployUrl) + '?path=' + options.context + '&update=' + options.update,
    method: 'PUT'
  };

  gutil.log(_http_options);

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isBuffer()) {
      // TODO: convert buffer to stream
    }

    var req = http.request(_http_options, function(res) {
      var content = '';
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        content += chunk;
      });
      res.on('err', function (chunk) {
        cb(new gutil.PluginError(PLUGIN_NAME, chunk));
      });
      res.on('end', function (chunk) {
        if(/^OK.*$/m.test(content)) {
          gutil.log(content);
          cb();
        } else if (res.statusCode === 401) {
          cb(new gutil.PluginError(PLUGIN_NAME, "Unable to authorize Tomcat credentials."));
        } else {
          cb(new gutil.PluginError(PLUGIN_NAME, content));
        }
      });
    });

    file.pipe(req);
    this.push(file);
  });
}

module.exports = gulpTomcatDeploy;
