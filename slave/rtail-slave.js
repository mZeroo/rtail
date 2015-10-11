#!/usr/bin/env node

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var Cache = require("node-cache")
var hostsToLogs = new Cache({ stdTTL: 10, checkperiod: 120 })
var argv = require('optimist').argv

hostsToLogs.on( "expired", function(host, logs) {
  console.log("Remove:" + host + " " + logs)
})

app.get('/', function(req, res){
  var data = {}
  hosts = hostsToLogs.keys();
  for (var i in hosts) {
    data[hosts[i]] = hostsToLogs.get(hosts[i])
  }
  res.send(JSON.stringify(data))
})

io.on('connection', function(socket) {
  socket.on('register', function(data) {
    console.log('register: ' + JSON.stringify(data))
    hostsToLogs.set(data["host"].split(".")[0], data)
  })

  socket.on('ask-logs', function() {
    var data = {}
    hosts = hostsToLogs.keys();
    for (var i in hosts) {
      data[hosts[i]] = hostsToLogs.get(hosts[i])
    }
    socket.emit('ans-logs', data)
  })

  socket.on('disconnect', function() {
    console.log("disconnected: " + socket.handshake.address)
  })
  
})

http.listen(argv.p, function() {
  console.log("Listening on " + argv.p)
}).on("error", function(error) {
  console.log(error)
})
