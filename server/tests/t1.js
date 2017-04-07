let motor = require('../modules/motor-shim.js');
let all = ['1','2','3','4'];

let speed = 9 ;
if(process.argv[2]){
    speed = Number(process.argv[2])
    speed = 10;
    console.log('Speed (not using input )',speed);
    motor.testInit(false,()=>{
        let res = {};
        
        console.log('Throttle 1 at 10')
        motor.throttle('1',speed);
        delay(500);
        motor.halt('1');    

        console.log('Throttle 2 at 10')
        motor.throttle('2',speed);
        delay(500);  
        motor.halt('2');    
          
        
        console.log('Throttle 3 at 10')
        motor.throttle('3',speed);
        delay(500);    
        motor.halt('3');    

        console.log('Throttle 4 at 10')
        motor.throttle('4',speed);
        delay(500);    
        motor.halt('4');    
        
        console.log('Throttle all at 10')
        motor.multiThrottle(all,speed);
        delay(500);    
        motor.multiHalt(all);
        
        console.log('Done')
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
