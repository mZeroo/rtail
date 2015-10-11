var os = require("os")

exports.localIpv4Address = function () {
  var ifaces = os.networkInterfaces();
  var ipAddress = null

  Object.keys(ifaces).forEach(function (ifname) {
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        return
      }
      ipAddress = iface.address
    })
  })

  return ipAddress
}

exports.endsWith = function(str, suffix) {
	return str.indexOf(suffix) == str.length - suffix.length
}

exports.startsWith = function(str, prefix) {
	return str.indexOf(prefix) == 0
}

exports.arrDiff = function(a1, a2) {
  var a = [], diff = []
  for(var i = 0; i < a1.length; i++) {
    a[a1[i]]=true;
  }

  for(var i=0; i < a2.length; i++) {
    if(a[a2[i]]) delete a[a2[i]];
    else a[a2[i]]=true;
  }
  
  for(var k in a) {
    diff.push(k)
  }
  return diff
}