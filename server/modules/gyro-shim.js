var five = require("johnny-five");
var Raspi = require("raspi-io");
let config = require('./config')
shim ={
    isStarted : false ,
    subs : [] ,
    currentReadings : {},
    init:()=>{
        shim.board = new five.Board({
            io: new Raspi()
        });
        shim.board.on("ready", function() {
            var imu = new five.IMU({
                controller: "MPU6050",
                address: config.gyroAddress, // optional
                freq: config.gyroStreamFrequency    
            });
            shim.isStarted = true ;
            imu.on("change", function(){ 
                let self = this;
                if(config.gyroLogsEnable)
                {
                    gyroLogger(self);
                }
                //console.log('Yo : ',shim.subs.length)
                // shim.subs.forEach(function(elementSub) {
                //     elementSub(self.gyro);
                // });
                shim.currentReadings =  gyro.accelerometer ;
            });
        });
    },
    subscribe:(sub)=>{
        if(shim.isStarted && sub && (typeof sub == 'function')){
            shim.subs.push(sub);
            console.log('Subscribing to gyro: ',shim.subs.length);
        }
    }
};
module.exports = shim ;

let gyroLogger = function(sensorthis) {
    console.log("Thermometer");
    console.log("  celsius      : ", sensorthis.thermometer.celsius);
    console.log("  fahrenheit   : ", sensorthis.thermometer.fahrenheit);
    console.log("  kelvin       : ", sensorthis.thermometer.kelvin);
    console.log("--------------------sensor------------------");

    console.log("Accelerometer");
    console.log("  x            : ", sensorthis.accelerometer.x);
    console.log("  y            : ", sensorthis.accelerometer.y);
    console.log("  z            : ", sensorthis.accelerometer.z);
    console.log("  pitch        : ", sensorthis.accelerometer.pitch);
    console.log("  roll         : ", sensorthis.accelerometer.roll);
    console.log("  acceleration : ", sensorthis.accelerometer.acceleration);
    console.log("  inclination  : ", sensorthis.accelerometer.inclination);
    console.log("  orientation  : ", sensorthis.accelerometer.orientation);
    console.log("--------------------sensor------------------");

    console.log("Gyroscope");
    console.log("  x            : ", sensorthis.gyro.x);
    console.log("  y            : ", sensorthis.gyro.y);
    console.log("  z            : ", sensorthis.gyro.z);
    console.log("  pitch        : ", sensorthis.gyro.pitch);
    console.log("  roll         : ", sensorthis.gyro.roll);
    console.log("  yaw          : ", sensorthis.gyro.yaw);
    console.log("  rate         : ", sensorthis.gyro.rate);
    console.log("  isCalibrated : ", sensorthis.gyro.isCalibrated);
    console.log("--------------------------------------");
};