const raspi = require('raspi');
const PWM = require('raspi-pwm').PWM;
let speed = 9 ;
if(process.argv[2] ){
    speed = Number(process.argv[2])
    raspi.init(() => {
      console.log('init')
      const pwm1 = new PWM('GPIO18');
      pwm1.write(speed); // Center a servo
      console.log('speed On GPIO18 : ',speed);
    });
}else{
  console.log('fail')
}
// GPIO18 = pin 7 

