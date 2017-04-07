let motor = require('../modules/motor-shim.js');
let all = ['1','2','3','4'];

let speed = 9 ;
if(process.argv[2]){
    speed = Number(process.argv[2])
    console.log('Speed ',speed);
    motor.testInit(false,()=>{
        let res = {};
         
        console.log('Throttle all at '+speed)
        motor.multiThrottle(all,10);
        delay(500);    
        motor.multiHalt(all);
        
        console.log('Done');

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
