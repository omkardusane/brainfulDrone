const raspi = require('raspi');
const PWM = require('raspi-pwm').PWM;
const config = require('./config.js');


let self ={
    auto : false,
    pwm : {
        'all':{
            pin:'GPIO18',
            throttle:9,
            interface: null ,
        },
        '1':{
            pin:'GPIO17', // make 18
            throttle:9,
            interface: null ,
        },
        '2':{
            pin:'GPIO19',
            throttle:9,
            interface: null ,
        },
        '3':{
            pin:'GPIO12',
            throttle:9,
            interface: null ,
        },
        '4':{
            pin:'GPIO13',
            throttle:9,
            interface: null ,
        },
    },
    init : (next)=>{
        raspi.init(() => {
            console.log('initializing motor interfaces')
            if(config.allMotorSingleControlMode){
                motorPWMInitializer(self.pwm.all);
            }else{
                independentMotorsInitialize(self.pwm)
            }
            next();
            console.log('success: motor interfaces initialized');
        });
    },
    testInit:(allOne,next)=>{
        raspi.init(() => {
            if(allOne){
                console.log('initializing AllOne motor interfaces')
                motorPWMInitializer(self.pwm.all);
            }else{
                console.log('initializing Indipendent motor interfaces')
                independentMotorsInitialize(self.pwm)
            }
            console.log('success: motor interfaces initialized');
            next();
        });
    },
    halt:(selected)=>{
        self.pwm[selected].interface.write(9);
    },
    multiHalt:(selected)=>{
        selected.forEach(i=>{
           self.pwm[i].interface.write(9);
        });
    },
    throttle:(selected,speed,res,next)=>{
        if(!res) res = {};        
        if(speed>=9 && speed<=99){
            self.pwm[selected].interface.write(speed)
            res=({ok:true,message:'accepted this throttle'});
        }else{
            res=({ok:false,message:'invalid throttle'});
        }
        if(next)
        next();
    },
    multiThrottle:(selected,speed,res,next)=>{
        if(!res) res = {};
        if(speed>=9 && speed<=99){
            selected.forEach(i=>{
                 self.pwm[i].interface.write(speed);
            });
            res=({ok:true,message:'accepted this throttle'});
        }else{
            res=({ok:false,message:'invalid throttle'});
        }
        if(next)
        next();
    }
    
}

let independentMotorsInitialize = pwm=>{
    ['1','2','3','4'].forEach(i=>{
        motorPWMInitializer(pwm[i]);
    });
}
let motorPWMInitializer = settings=>{
        settings.interface = new PWM(settings.pin);
        settings.interface.write(9); // init at 9 
}

module.exports = self ;