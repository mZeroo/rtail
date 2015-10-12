#!/usr/bin/env node

var _ = require("underscore")
var S = require("underscore.string")

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var ioClient = require('socket.io-client')
var spawn = require('child_process').spawn
var config = require('./slave-config.json')
var premitedLogFiles = config["logs"]
var os = require("os")

var util = require("./utils")
var port = require('optimist').argv.p || 8410

var register = function() {
  var addr = config['config-server']
  var socket = ioClient.connect(addr, { 'timeout': 100, 'reconnectionAttempts': 2 , 'forceNew': true})

  socket.on('connect', function() {
    var data = {}
    data["host"] = os.hostname()
    data["addr"] = "http://" + util.localIpv4Address() + ":" + port
    data["logs"] = premitedLogFiles
    socket.emit('register', data)
    console.log("Register success: " + addr)
    socket.close()
  })

  socket.on('reconnect_failed', function() {
    console.log('Register failed: ' + addr)
  })

}

var translateLogs = function(logFiles) {
  var mapping = {}
  _.each(logFiles, function(logFile) {
    mappingFile = _.filter(premitedLogFiles, function(file) { return S(file).endsWith(logFile) })[0]
    if (mappingFile) mapping[logFile] = mappingFile
  })
  return mapping
}


io.on('connection', function(socket) {
  console.log("connected: " + socket.request.connection.remoteAddress)
  
  var tail = null

  socket.on('tail', function(data) {
    var options = data.split(" ")
    
    var logFiles = _.filter(options, function(p) { return !S(p).startsWith("-") } )
    var logFileMapping = translateLogs(logFiles)
    var invalidLogs = _.filter(logFiles, function(logFile) { return !(logFile in logFileMapping) })

    if (invalidLogs.length > 0) {
      socket.emit('sys', "Invalid logs:" + JSON.stringify(invalidLogs))
      socket.disconnect()
    }

    options = _.map(options, function(p) { 
      if (p in logFileMapping) return logFileMapping[p]
      else return p
    })

    tail = spawn('tail', options)
    tail.stdout.setEncoding('utf8')

    tail.on('exit', function(exitCode) {
      console.log("Child exited with code: " + exitCode);
      if (exitCode != 0) {
        socket.emit('sys', 'Error: ' + exitCode)
      }
      socket.disconnect()
    })

    breakLine = ''
    tail.stdout.on('data', function(data) {
      lines = breakLine + data.toString()
      lastEnter = lines.lastIndexOf("\n")
      breakLine = lines.slice(lastEnter)
      socket.emit('sys', lines.slice(0, lastEnter + 1))
    })

    tail.stderr.on('data', function(data) {
      socket.emit('sys', data.toString())
    })

  })

  socket.on('list', function() {
    socket.emit('sys', "Support logs: \n" + premitedLogFiles.join("\n"))
    socket.disconnect()
  })

  socket.on('disconnect', function() {
    if (null != tail) {
      tail.kill('SIGINT')
    }
    console.log("disconnected: " + socket.request.connection.remoteAddress)
  })
})

http.listen(port, function(){
  console.log("Listening on " + port)
  register()
  setInterval(register, 30 * 1000)
}).on("error", function(error) {
  console.log(error)
})
