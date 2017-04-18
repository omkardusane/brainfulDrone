var i2cBus = require("i2c-bus");
var Pca9685Driver = require("pca9685").Pca9685Driver;
 
var options = {
    i2c: i2cBus.openSync(1),
    address: 0x40,
    frequency: 50,
    debug: false
};



let pwm = new Pca9685Driver(options, function(err) {
    if (err) {
        console.error("Error initializing PCA9685");
        process.exit(-1);
    }
    console.log("Initialization done");
 
    if(process.argv[2]){
      let a = Number(process.argv[2]) ;
      a = a /1000 ;
      console.log('Setting all -------------------------> ',a);
      pwm.setDutyCycle(4, a);
      pwm.setDutyCycle(5, a);
      pwm.setDutyCycle(6, a);
      pwm.setDutyCycle(7, a); 
    }
    
 });