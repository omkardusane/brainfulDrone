var makePwm = require( "adafruit-pca9685" );
var pwm = makePwm({
    "freq": 50,   // frequency of the device 
    "correctionFactor": "1.0", // correction factor - fine tune the frequency  
    "address": 0x40, // i2c bus address 
    "device": '/dev/i2c-1', // device name 
    "debug": false// adds some debugging methods if set  
  });


if(process.argv[2] && process.argv[3]){
    let min = 0 , max = 10 ;
    let pin  =  Number(process.argv[2]) ;
    max = Number(process.argv[3])  ;
    pwm.setPwm(pin,min , max ); 
    console.log('Kiya  :',pin ,' ---------------------------- > ',max)
//    pwm.stop();
}
