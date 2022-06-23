import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import ef from 'express-fileupload';
import favicon from 'serve-favicon';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import { getIPAddress } from './util/utility.js';
import timesync_server from 'timesync/server/index.js';


const ConnectionStatus =
{
  unknown: 0,
  fine: 1,
  disconnected: 2,
  other: 3
};

process.env.IP = getIPAddress();
process.env.PORT = 8080;
process.env.NTP_PORT = 8081;

const __dirname = path.resolve();

// Initialize ntp sync service
var sync_app = express();
sync_app.use('/', express.static(__dirname));
sync_app.use('/timesync/', express.static(__dirname));

sync_app.post('/timesync', function (req, res) {
  var data = {
    id: (req.body && 'id' in req.body) ? req.body.id : null,
    result: Date.now()
  };
  res.json(data);
  console.log("Sending time %d", data.result);
});
sync_app.listen(process.env.NTP_PORT, process.env.IP)
console.log("Sync server listening on %s:%d", process.env.IP, process.env.NTP_PORT);


// Main service
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(ef());
app.use(favicon(path.join(__dirname, 'favicon.ico')));


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

export default app;
export {__dirname, ConnectionStatus};