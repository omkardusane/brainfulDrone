const config = require('./config.js');
var makePwm = require( "adafruit-pca9685" );
let self ={
    auto : false,
    address : config.motorAddress ,
    motors : [6,7,9,10],
    settings :{ kickUpTick : 0 , kickDownTickMin : 40 , kickDownTickMax : 600 },
    wire : null,
    init : (next)=>{ 
        self.wire = makePwm({
            "freq": 50,   // frequency of the device 
            "correctionFactor": "1.0", // correction factor - fine tune the frequency  
            "address": self.address, // i2c bus address 
            "device": '/dev/i2c-1', // device name 
            "debug": false// adds some debugging methods if set  
        });
        self.haltAll();
        next();
    },
    testInit:(allOne,next)=>{
       next();
    },
    haltAll:(next)=>{
        self.motors.forEach((motor)=>{
            self.wire.setPwm(motor, self.settings.kickUpTick, self.settings.kickDownTickMin);
        });
        if(next) next();
    },
    throttle:(selected,speed,next)=>{
        selected-=1;
        self.wire.setPwm(self.motors[selected],self.settings.kickUpTick, speed);
        console.log('throttle Sent to Motor : ',selected," -> ",speed);
        if(next) next();
    },
    multiThrottle:(selected,speeds,next)=>{
        selected.forEach((obj,index)=>{
            self.wire.setPwm(self.motors[obj-1],self.settings.kickUpTick, speeds[index]);
        });
        console.log('multiThrottle Sent to Motors : ',selected,' -> ',speeds);
        if(next) next();
    },    
    allThrottle:(speed,next)=>{
        self.motors.forEach((motor)=>{
            self.wire.setPwm(motor, self.settings.kickUpTick, speed);
        });
        console.log('allThrottle Sent to Motors , speed is ',speed);
        if(next) next();
    },    
}

module.exports = self ;
