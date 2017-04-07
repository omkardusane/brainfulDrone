let motor = require('../modules/motor-shim.js');
let all = ['1','2','3','4'];

let speed = 9 ;
if(process.argv[2]){
    speed = Number(process.argv[2])
    console.log('Speed ',speed);
    motor.testInit(false,()=>{
        let res = {};
        
        motor.throttle('1',10);
        delay(500);
        motor.halt('1');    

        motor.throttle('2',10);
        delay(500);  
        motor.halt('2');    
          
        
        motor.throttle('3',10);
        delay(500);    
        motor.halt('3');    

        motor.throttle('4',10);
        delay(500);    
        motor.halt('4');    
        
        motor.multiThrottle(all,10);
        delay(500);    
        motor.multiHalt(all);
        
    });
}else{
    console.log('No speed provided')
}

let delay = (millis)=>{
    let timeOut = (new Date()).getTime() + millis;
    while((new Date()).getTime()< timeOut){

    }
    return true;
}
