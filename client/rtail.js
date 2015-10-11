#!/usr/bin/env node

var io = require('socket.io-client')
var config = require('./client-config.json')
var args = process.argv.slice(2)

var tailRemoteLog = function(addr, options) {
  var socket = io.connect(addr, { 'timeout': 100, 'reconnectionAttempts': 2 })

  socket.on('connect', function () {
    socket.emit('tail', args.slice(1).join(' '))
  })

  socket.on('sys', function(data) {
    console.log(data)
  })

  socket.on('connect_failed', function() {
    console.log('Connection Failed');
  })

  socket.on('reconnect_failed', function() {
    console.log('Connect Failed: ' + addr);
  })
}

var fetchConfig = function(addr, callback) {
  var socket = io.connect(addr, { 'timeout': 100, 'reconnectionAttempts': 2 })

  socket.on('connect', function () {
    socket.emit('ask-logs')
  })

  socket.on('ans-logs', function(data) {
    callback(data)
    socket.close()
  })

  socket.on('connect_failed', function() {
    console.log('Connection Failed')
    process.exit(-1)
  })

  socket.on('reconnect_failed', function() {
    console.log('Connect Failed: ' + addr)
    process.exit(-1)
  })
}

var showHelp = function() {
  console.log("Usage: ")
  console.log("-all                           list all support host and logs")
  console.log("-host                          list all support host")
  console.log("<host> -log                    list all support logs of <host>")
  console.log("<host> <tail-option> <log>     tail <log> on the <host>, <tail-option> can be any option support by tail")
  console.log("--help                         list the help info")
}

if (args[0] == '--help') {
  showHelp()
  process.exit(-1)
} else if (args[0] == '-all') {
  fetchConfig(config["config-server"], function(data) {
    console.log(data)
    process.exit(-1)
  })
} else if (args[0] == '-host') {
  fetchConfig(config["config-server"], function(data) {
    logConfig = eval(data)
    console.log("Surport hosts: \n" + Object.keys(logConfig).join("\n"))
    process.exit(-1)
  })
} else if (args[1] == '-log') {
  fetchConfig(config["config-server"], function(logConfig) {
    console.log("Surport logs: \n" + logConfig[args[0]]["logs"].join("\n"))
    process.exit(-1)
  })
} else {
  if (args.length < 3) {
    console.log("option is incorrect.")
    showHelp()
    process.exit(-1)
  }

  var hostname = args[0]
  var options = args.slice[1]

  fetchConfig(config["config-server"], function(logConfig) {
    tailRemoteLog(logConfig[hostname]['addr'], options)
  })
}


