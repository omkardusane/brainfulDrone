var five = require("johnny-five");
var Raspi = require("raspi-io");
let config = require('./config')
let shim ={
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
                    gyroLogger(self)
                }
                //console.log('Yo : ',shim.subs.length)
                // shim.subs.forEach(function(elementSub) {
                //     elementSub(self.gyro,
                // },
                shim.currentReadings = gyroAngles(gyroRead(this));
            });
        })
    },
    subscribe:(sub)=>{
        if(shim.isStarted && sub && (typeof sub == 'function')){
            shim.subs.push(sub);
            console.log('Subscribing to gyro: ',shim.subs.length);
        }
    }
};
module.exports = shim ;

let gyroRead = sensorthis=>{
    return {
        thermometer: {
            celsius :sensorthis.thermometer.celsius,
            fahrenheit:sensorthis.thermometer.fahrenheit,
            kelvin :sensorthis.thermometer.kelvin,
        },
        accelerometer:{
            x:sensorthis.accelerometer.x,
            y:sensorthis.accelerometer.y,
            z:sensorthis.accelerometer.z,
            pitch:sensorthis.accelerometer.pitch,
            roll:sensorthis.accelerometer.roll,
            acc:sensorthis.accelerometer.acceleration,
            incl:sensorthis.accelerometer.inclination,
            ori:sensorthis.accelerometer.orientation,
        },
        gyro:{
            x:sensorthis.gyro.x,
            y:sensorthis.gyro.y,
            z:sensorthis.gyro.z,
            pitch:sensorthis.gyro.pitch,
            roll:sensorthis.gyro.roll,
            yaw:sensorthis.gyro.yaw,
            rate:sensorthis.gyro.rate,
            isCalibrated:sensorthis.gyro.isCalibrated,
        }
    };
}

let gyroAngles = (reading)=>{
    return {
        x : reading.gyro.pitch.angle/2 ,
        z : reading.gyro.roll.angle/2 ,
        y : -1*reading.gyro.yaw.angle/2 
    }

    // x y z 
    // y x z
    // z x y 
    // x z y
}

let gyroLogger = function(sensorthis) {
    console.log(gyroRead(sensorthis));
};

