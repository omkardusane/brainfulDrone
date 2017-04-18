var makePwm = require( "adafruit-pca9685" );
var pwm = makePwm({
    "freq": 50,   // frequency of the device 
    "correctionFactor": "1.0", // correction factor - fine tune the frequency  
    "address": 0x40, // i2c bus address 
    "device": '/dev/i2c-1', // device name 
    "debug": false// adds some debugging methods if set  
  });


if(process.argv[2]){
    let min = 0 , max = 10 ;
    let a  =  process.argv[2] ;
    max = a ;

    pwm.setPwm(10,min , max ); 
    pwm.setPwm(9,min , max ); 
    
    pwm.setPwm(6,min , max ); 
    pwm.setPwm(7,min , max ); 
    

    // pwm.setPulse(9, a );
    // pwm.setPulse(8, a );
    
    // pwm.setPulse(6, a );
    // pwm.setPulse(7, a );
    
    console.log('Kiya  : ---------------------------- > ',a)
//    pwm.stop();
}
