var five = require("johnny-five");
//var board = new five.Board();
var Raspi = require("raspi-io");
var board = new five.Board({
  io: new Raspi()
});
// var controller = "GP2Y0A02YK0F";

board.on("ready", function() {
  
});
