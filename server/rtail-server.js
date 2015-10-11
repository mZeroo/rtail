#!/usr/bin/env node

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var ioClient = require('socket.io-client')
var spawn = require('child_process').spawn
var config = require('./server-config.json')
var premitedLogFiles = config["logs"]
var os = require("os")
var util = require("./utils")
var argv = require('optimist').argv

var register = function() {
  var addr = config['config-server']
  var socket = ioClient.connect(addr, { 'timeout': 100, 'reconnectionAttempts': 2 , 'forceNew': true})

  socket.on('connect', function() {
    var data = {}
    data["host"] = os.hostname()
    data["addr"] = "http://" + util.localIpv4Address() + ":" + argv.p
    data["logs"] = premitedLogFiles
    socket.emit('register', data)
    console.log("Register success: " + addr)
    socket.close()
  })

  socket.on('reconnect_failed', function() {
    console.log('Register failed: ' + addr)
  })

}

var strNotStartsWith = function(strs, start) {
  var result = []
  for (var i in strs) {
    if (strs[i].indexOf(start) != 0) {
      result.push(strs[i])
    }
  }
  return result
}

var translateLogs = function(logFiles) {
  var dict = {}
  for (var i in logFiles) {
    for (var j in premitedLogFiles) {
      if (util.endsWith(premitedLogFiles[j], logFiles[i])) {
        dict[logFiles[i]] = premitedLogFiles[j]
      }
    }
  }
  return dict
}


io.on('connection', function(socket) {
  console.log("connected: " + socket.request.connection.remoteAddress)
  
  var tail = null

  socket.on('tail', function(data) {
    var options = data.split(" ")
    
    var logFiles = strNotStartsWith(options, '-')
    var dict = translateLogs(logFiles)
    var invalidLogs = util.arrDiff(logFiles, Object.keys(dict))

    if (invalidLogs.length > 0) {
      socket.emit('sys', "Invalid logs:" + JSON.stringify(invalidLogs))
      socket.disconnect()
    }

    for (var i in options) {
      if (logFiles.indexOf(options[i]) >= 0) {
        options[i] = dict[options[i]]
      }
    }

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

http.listen(argv.p, function(){
  console.log("Listening on " + argv.p)
  register()
  setInterval(register, 3 * 1000)
}).on("error", function(error) {
  console.log(error)
})
