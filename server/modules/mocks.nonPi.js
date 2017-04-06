module.exports ={
    motor:{
        init:next=>{
            console.log('----- Mock Motor ------')
            next()
        },
        throttle:(selected,speed,res)=>{
            if(speed>=9 && speed<=99){
                res=({ok:true,message:'accepted this throttle'});
            }else{
                res=({ok:false,message:'invalid throttle'});
            }
        }

    },
    gyro:{}
}