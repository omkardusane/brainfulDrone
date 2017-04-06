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
    throttle:(selected,speed,res)=>{
        if(speed>=9 && speed<=99){
            self.pwm[selected].interface.write()
            res=({ok:true,message:'accepted this throttle'});
        }else{
            res=({ok:false,message:'invalid throttle'});
        }
    },
    
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