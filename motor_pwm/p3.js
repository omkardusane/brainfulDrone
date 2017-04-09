const raspi = require('raspi');
const PWM = require('raspi-pwm').PWM;
let speed = 9 ;
if(process.argv[2] ){
    speed = Number(process.argv[2])
    console.log('Speed ',speed);
    raspi.init(() => {
      console.log('init')
      let pin1 = 'GPIO24';
      const pwm1 = new PWM(pin1);
      pwm1.write(speed);  
      let pin2 = 'GPIO25';
      const pwm2 = new PWM(pin2);
      pwm2.write(speed); 
      console.log('speed On GPIO24 , GPIO25 : ',speed);
    });
}else{
  console.log('fail')
}
// GPIO18 = pin 7 

