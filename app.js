var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var moment = require('moment');
var logs = require('overrustle-logs');
var https = require('https');
var child_process = require('child_process');
var cors = require('cors');

var index = require('./routes/index');
var users = require('./routes/users');
var app = express();

app.use(cors()); 
app.use(express.static(path.join(__dirname, '../')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// var toptwitch = require('./public/javascripts/toptwitch.js');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/', function(req, res, next) {
	var getClip = require('./public/javascripts/toptwitch.js');
	getClip(req.body.id,req.body.phrase,req.body.frequency,req.body.sample,function(vidtimes){
		console.log(vidtimes);
		res.send(vidtimes);
	});
});

app.listen(8080, function() {
  console.log('Server running at http://127.0.0.1:8080/');
});

// app.use(require('./public/javascripts/'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
