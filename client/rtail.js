#!/usr/bin/env node

var io = require('socket.io-client')
var config = require('./client-config.json')
var agrs = process.argv.slice(2)

var tailRemoteLog = function(addr, options) {
  var socket = io.connect(addr, { 'timeout': 100, 'reconnectionAttempts': 2 })

  socket.on('connect', function () {
    socket.emit('tail', agrs.slice(1).join(' '))
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

// list all host: ./rtail.js -all
if (agrs[0] == '-all') {
  fetchConfig(config["config-server"], function(data) {
    console.log(data)
    process.exit(-1)
  })
}

// list all host: ./rtail.js -host
if (agrs[0] == '-host') {
  fetchConfig(config["config-server"], function(data) {
    logConfig = eval(data)
    console.log("Surport hosts: \n" + Object.keys(logConfig).join("\n"))
    process.exit(-1)
  })
}

// list all host: ./rtail.js localbox -log
if (agrs[1] == '-log') {
  fetchConfig(config["config-server"], function(logConfig) {
    console.log("Surport logs: \n" + logConfig[agrs[0]]["logs"].join("\n"))
    process.exit(-1)
  })
}

var hostname = agrs[0]
var options = agrs.slice[1]

fetchConfig(config["config-server"], function(logConfig) {
  tailRemoteLog(logConfig[hostname]['addr'], options)
})


