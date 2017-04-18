let motor = null;
let gyro = null;
let i=0;
let maxThrottleAllowed = 580; 
let config = require('./config');
module.exports =  {
    setReferences: (m,g)=>{
        motor = m ;
        gyro = g ;
    },
    socketHandle : function(client) {  
        i++;
        console.log('Clients connected '+i);
        let statusUpdate = (status)=>{
            client.emit('motor-status', status);
        }
        let tellClient = (msg)=>{
            client.emit('msg-client', msg);
        }
    
        client.on('msg', function(data) {
            console.log(data);
        });

        client.on('get-video-stream',function(cb){
            if(cb)
            cb(config.camStreamSrc);
        });

        client.on('start-gyro-stream',function(){
            console.log('starting gyro stream');
            // gyro.subscribe(function(readings){
            //    client.emit('gyro-stream-in',readings)
            // });
            setInterval(()=>{
                //console.log('emmitting: ',gyro.currentReadings)
                
                client.emit('gyro-stream-in',gyro.currentReadings);
            },config.gyroStreaminterval);
        });
        
        client.on('stop-motor', function(data) {
            console.log('stop-motor');
            motor.haltAll();
            statusUpdate('Stopped');          
        });

        client.on('speed-motor', function(data) {
            console.log("speed-motor ",data)
            if(data.payload && data.payload.motorNumber && data.payload.value  && !isNaN(data.payload.value)){
                if(data.payload.value<0){
                    data.payload.value = 0 ;
                }else if(data.payload.value > maxThrottleAllowed){
                    data.payload.value = maxThrottleAllowed ;
                }
                motor.throttle(Number(data.payload.motorNumber),Number(data.payload.value),()=>{
                    console.log("Single Throttle : ",data.payload.value)
                });
            }else{
               console.log("Error in receiving data");
            }
        });
        
        client.on('speed-all-motor', function(data) {
            console.log("speed-all-motor ",data)
            if(data.payload && data.payload.value && !isNaN(data.payload.value)){
                if(data.payload.value<0){
                    data.payload.value = 0;
                }else if(data.payload.value > maxThrottleAllowed){
                    data.payload.value = maxThrottleAllowed ;
                }
                motor.allThrottle(Number(data.payload.value), ()=>{
                    console.log('AllThrottle :',data.payload.value);
                });
            }else{
               console.log("Error in receiving data");
            }
        });

        client.on('speed-dual-motor', function(data) {
            console.log("speed-dual-motor ",data)
            if(data.payload && data.payload.value && data.payload.m1 && data.payload.m2  && !isNaN(data.payload.value)){
                
                let motors = [Number(data.payload.m1),Number (data.payload.m2)] ;
                let speeds = [Number(data.payload.value), Number(data.payload.value)] ;

                if(data.payload.value<0){
                    data.payload.value = 0 ;
                }else if(data.payload.value > maxThrottleAllowed){
                    data.payload.value = maxThrottleAllowed ;
                }
                motor.multiThrottle(motors,speeds, ()=>{
                    console.log('MultiThrottle :',motors," -> ",speeds[0])
                });
                
            }else{
               console.log("Error in receiving data");
            }
        });
        
        client.on('disconnect', function() { i--; }); 
    }
};
