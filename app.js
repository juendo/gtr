
/**
 * Module dependencies
 */
var express = require('express');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var routes = require('./routes'),
  http = require('http'),
  path = require('path');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io')({
	'transports': ['xhr-polling'],
	'polling duration': 10
}).listen(server);

/**
 * Configuration
 */

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(methodOverride());
app.use(session({ resave: true, saveUninitialized: true, 
                  secret: 'uwotm8' }));

// parse application/json
app.use(bodyParser.json());                        

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse multipart/form-data
app.use(multer());

app.use(express.static(path.join(__dirname, 'public')));



/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);

var s = require('./routes/socket');
var ss = s(io);
// Socket.io Communication
io.sockets.on('connection', ss);

/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
