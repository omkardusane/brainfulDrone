var v4l2camera = require("v4l2camera");
var cam = new v4l2camera.Camera("/dev/video0");

let f = { formatName: 'YUYV',
  format: 1448695129,
  width: 640,
  height: 480
}
cam.configSet(f);

console.log(cam.configGet()) ;

// if (cam.configGet().formatName !== "MJPG") {
//   console.log("NOTICE: MJPG camera required");
//   process.exit(1);
// }
cam.start();
cam.capture(function (success) {
  var frame = cam.toRGB();
  console.log(frame[0]);

  cam.stop();
});