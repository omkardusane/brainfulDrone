module.exports ={
    motor:{
        init:next=>{
            console.log('----- Mock Motor ------')
            next()
        },
    
        halt:(selected)=>{
         
        },
        multiHalt:(selected)=>{

        },
        throttle:(selected,speed,res,next)=>{
            if(next)
            next();
        },
        multiThrottle:(selected,speed,res,next)=>{
            if(next)
            next();
        }

    },
    gyro:{}
}