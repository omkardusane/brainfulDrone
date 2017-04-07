const raspi = require('raspi');
const PWM = require('raspi-pwm').PWM;
console.log('start now')
let speed = 9 ;
let pin = 1 ;
if(process.argv[2] && process.argv[3]){
    speed = Number(process.argv[2])
    pin = Number(process.argv[3])
    console.log('Speed ',speed);
    raspi.init(() => {
      console.log('init')
      let pinStr = 'GPIO18';
      switch(pin){
        case 0:
          pinStr = 'GPIO18';
          break;
        case 1:
          pinStr = 'GPIO17';
          break;
        case 2:
          pinStr = 'GPIO19';
          break;
        case 3:
          pinStr = 'GPIO12';
          break;
        case 4:
          pinStr = 'GPIO13';
          break;
      }
      const pwm = new PWM(pinStr);
      pwm.write(speed); // Center a servo
      console.log('speed On ',pinStr," : ",speed);
      
    });
}
// GPIO18 = pin 7 

