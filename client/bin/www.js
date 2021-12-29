#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from '../app.js';
import { createServer } from 'http';
import { getopt } from 'stdio';
import debug from 'debug';
debug.debug('mac:server');

/**
 * Get input arguments
 */
process.env.deviceName = 'client' + process.env.IP.split('.').pop()
const argv = getopt({
  "name": {"key": "n", "description": "The device name assigned by user"},
  "ip":   {"key": "i", "description": "The assigned IP address to open service"},
  "port": {"key": "p", "description": "The assigned port of service"}
})
let arg_keys = Object.keys(argv)
// If there's only one argument without indicator, speicified as name
if (arg_keys.length == 1) {
  process.env.deviceName = argv.args[0];
}
else {
  for (let i = 0; i < arg_keys.length-1; i++) {
    let key = arg_keys[i];
    if (key === "name")
      process.env.deviceName = argv.args[i]
    else if (key === "ip")
      process.env.IP = argv.args[i];
    else if (key === "port")
      process.env.PORT = argv.args[i];
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

console.log('Service listening on ' + process.env.IP + ":" + port.toString() + " as name \"" + process.env.deviceName + "\"");

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
