import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import ef from 'express-fileupload';
import favicon from 'serve-favicon';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';

const ConnectionStatus =
{
  unknown: 0,
  fine: 1,
  disconnected: 2,
  other: 3
};

const IP = 'localhost';
const PORT = '8080';


var app = express();
const __dirname = path.resolve();

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
export {__dirname, ConnectionStatus, IP, PORT};