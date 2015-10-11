var _ = require("underscore")
var os = require("os")

exports.localIpv4Address = function () {
  var ipv4Address
  _.each(os.networkInterfaces(), function(ifaces) {
    _.each(ifaces, function(iface) {
      if('IPv4' === iface.family && !iface.internal) {
        ipv4Address = iface.address
      }
    })
  })
  return ipv4Address
}