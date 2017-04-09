const raspi = require('raspi');
const PWM = require('raspi-pwm').PWM;
let speed = 9 ;
if(process.argv[2] ){
    speed = Number(process.argv[2])
    console.log('Speed ',speed);
    raspi.init(() => {
      console.log('init')
     /* let pin1 = 'GPIO18';
      const pwm1 = new PWM(pin1);
      pwm1.write(speed); // Center a servo
     */ 
      let pin2 = 'GPIO13';
      const pwm2 = new PWM(pin2);
      pwm2.write(speed); // Center a servo
      console.log('speed On GPIO13 : ',speed);
    });
}else{
  console.log('fail')
}
// GPIO18 = pin 7 

