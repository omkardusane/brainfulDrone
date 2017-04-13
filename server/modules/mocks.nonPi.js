module.exports ={
    motor:{
        init:next=>{
            console.log('----- Mock Motor ------')
            next()
        },
    
        halt:(selected,next)=>{
            if(next)next();
        },
        haltAll:next=>{
            if(next)next();
        },
        multiHalt:(selected)=>{
            if(next)next();
        },
        throttle:(selected,speed,next)=>{
            if(next)
            next();
        },
        multiThrottle:(selected,speeds,next)=>{
            if(next)
            next();
        },
        allThrottle:(speed,next)=>{
            if(next)
            next();
        }

    },
    gyro:{}
}