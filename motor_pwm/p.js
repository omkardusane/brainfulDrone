const raspi = require('raspi');
const PWM = require('raspi-pwm').PWM;
console.log('start now')
let speed = 9 ;
if(process.argv[2]){
    speed = Number(process.argv[2])
  }
// GPIO18 = pin 7 

console.log('Speed ',speed);
raspi.init(() => {
  console.log('init')
  const pwm = new PWM('GPIO18');
  pwm.write(speed); // Center a servo
  console.log('wrote');
  
});