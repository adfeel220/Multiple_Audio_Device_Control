#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from '../app.js';
import { createServer } from 'http';
import debug from 'debug';
debug.debug('mac:server');

/**
 * Get port arguments
 * 1st argument: PORT
 * 2nd argumetn: IP address
 */
 if (process.argv.length > 2) {
  let argv = process.argv.slice(2)
  process.env.PORT = Number(argv[0])

  if (argv.length > 1) {
    process.env.IP = argv[1]
  }
}

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT);
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, process.env.IP);
server.on('error', onError);
server.on('listening', onListening);

console.log('Service listening on ' + process.env.IP + ":" + port.toString());

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}