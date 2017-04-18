var makePwm = require( "adafruit-pca9685" );
var pwm = makePwm(
 {
    "freq": "50",   // frequency of the device 
    "correctionFactor": "1.0", // correction factor - fine tune the frequency  
    "address": 0x40, // i2c bus address 
    "device": '/dev/i2c-1', // device name 
    "debug": true// adds some debugging methods if set  
  });


if(process.argv[2] && process.argv[3]){
    let pin  =  process.argv[2] ;
    let a  =  process.argv[3] ;

    pwm.setPulse(Number(pin), Number(a) );

    console.log(pin,' -> ',a)
//    pwm.stop();
}
