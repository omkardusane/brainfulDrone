let motor = null;
let gyro = null;
let cameraTroubleShoot = null;
let i=0;
let maxThrottleAllowed = 580; 
let config = require('./config');
let io = null ;
let speeds = {max : 80 , off : 30 , min : 50};
var throttleDelays = 500 ;

const mission = require('./mission');

module.exports =  {
    setReferences: (socketIo,m,g,cameraTroubleShootFunction)=>{
        io = socketIo;
        motor = m ;
        gyro = g ;
        cameraTroubleShoot = cameraTroubleShootFunction;
    },
    socketHandle : function(client) {
        client.hasThermoStream = false ;  
        client.hasGyroStream = false ;  
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


        /****
         *  SENSORS CONTROLS
         * ***/

        client.on('shutdown-67rq3d2bo1iwcefl', function(){
            motor.haltAll(()=>{
                console.log('Shutting down')
                require('child_process').exec('sudo shutdown',function(e,so,se){

                });
            });
        });

        client.on('troubleshoot-camera', function(cb){
            cameraTroubleShoot();
            if(cb)cb();
        });

        client.on('troubleshoot-gyro', function(cb){
            gyro.reboot();
            if(cb)cb();
        });

        client.on('get-video-stream',function(cb){
            if(cb)
            cb(config.camStreamSrc);
        });

        client.on('start-gyro-stream',function(){
            console.log('starting gyro stream');
            if(!client.hasGyroStream){
                setInterval(()=>{
                    client.emit('gyro-stream-in',gyro.currentReadings);
                },config.gyroStreaminterval);
                client.hasGyroStream = true ;
            }
        });
        
        client.on('start-thermo-stream',function(){
            console.log('starting thermo stream');
            // gyro.subscribe(function(readings){
            //    client.emit('gyro-stream-in',readings)
            // });
            if(!client.hasThermoStream){
                setInterval(()=>{
                    client.emit('thermo-stream-in',gyro.currentThermo);
                },(config.gyroStreaminterval*2));
                client.hasThermoStream = true ;
            }
        });

        
        /****
         *  MOTORS CONTROLS
         * ***/

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
        
        /****
         *  MISSION CONTROLS
         * ***/
        let broadcastMissionStatus = (name,event)=>{
            io.sockets.emit('mission-status',name,event);
        }
        let broadcastMissionProgress = (name,event)=>{
            io.sockets.emit('mission-progress',name,event);
        }
        let broadcastMissionComplete = ()=>{
            io.sockets.emit('mission-complete');
        }
        client.on('mission-select',function(data,params,cb){
            console.log('MISSION SELECT : ',data," -> ",params);
            if(!!mission.options.types[data] && params && (params.length==2)){
                mission.selectMission(data,(reference,builder)=>{
                    reference = builder(params[0],params[1]);
                });
                if(cb){
                     cb({ok:true,message:'Mission Selected'})
                }
                gyro.reboot();
                broadcastMissionStatus(mission.currentMission().name,{status:'selected'});
            }else{
                if(cb)
                    cb({ok:false,message:'invalid mission selected'})
            }
        });

        client.on('mission-start',function(cb){
            if(mission.isReady()){
                mission.startMission(()=>{
                    let speed = 100 / mission.currentMission().time ; // millis
                    let delay = 1000 ;
                    let distance = 0 ;
                    let tick =  0 ;
                    let ticks =  mission.currentMission().time / delay ;
                    let checkPoints = [] ;
                    if(mission.currentMission().type == 2) // CIRCLE
                    {
                        distance = (44*(mission.currentMission().radius)/7);
                        checkPoints = [1 , ticks];
                    }
                    else if(mission.currentMission().type == 3)// SQUARE
                    {
                        distance = (4*(mission.currentMission().side));
                        checkPoints = [0 , (ticks/4) , (ticks/2) , (3*ticks/4) , ticks];
                    }
                    let intervalControl = setInterval(()=>{
                        if(tick <= ticks && mission.isStarted()){
                            mission.progress += (delay*speed);
                            if(mission.progress>100){
                                mission.progress = 100;
                            }
                            if(mission.currentMission().type == 2) // CIRCLE
                            {
                                checkPoints.forEach((t,index) =>{
                                    if(tick == t){
                                        if(index ==0){ // 0%
                                            motor.multiThrottle([1,2,3,4],[speeds.max,speeds.off,speeds.off,speeds.max]);
                                            setTimeout(()=>{
                                                motor.allThrottle(speeds.min);
                                            },throttleDelays);
                                        }
                                        else if(index == 1 || index ==2 || index ==3){ // 25% and 50% and 75%
                                            motor.multiThrottle([1,2,3,4],[speeds.max,speeds.off,speeds.off,speeds.off]);
                                            setTimeout(()=>{
                                                motor.multiThrottle([1,2,3,4],[speeds.max,speeds.max,speeds.off,speeds.off]);
                                                setTimeout(()=>{
                                                     motor.allThrottle(speeds.min);
                                                },throttleDelays);
                                            },throttleDelays);
                                        }
                                        else if(index ==4){ // 100%
                                            motor.multiThrottle([1,2,3,4],[speeds.off,speeds.max,speeds.max,speeds.off]);
                                            setTimeout(()=>{
                                                motor.haltAll();
                                            },throttleDelays);
                                        }
                                    }
                                })
                            }
                            if(mission.currentMission().type == 3) // SQUARE
                            {
                                checkPoints.forEach((t,index) =>{
                                    if(tick == t){
                                        if(index==0){ // 0%
                                            motor.multiThrottle([1,2,3,4],[speeds.max,speeds.off,speeds.off,speeds.off]);
                                            setTimeout(()=>{
                                                motor.multiThrottle([1,2,3,4],[speeds.max,speeds.max,speeds.min,speeds.min]);
                                                setTimeout(()=>{
                                                     motor.allThrottle(speeds.min);
                                                },throttleDelays);
                                            },throttleDelays);
                                        }else if(index == 1 ){ // 25%
                                            motor.multiThrottle([1,2,3,4],[speeds.off,speeds.off,speeds.off,speeds.max]);
                                            setTimeout(()=>{
                                                motor.haltAll();
                                            },throttleDelays);
                                        }
                                    }
                                })
                            }
                            let currTask = 'Straight Go Ahead' ;
                            
                            broadcastMissionProgress(mission.currentMission().name,{
                                progress : mission.progress ,
                                task : currTask,
                            });
                        }else{
                            clearInterval(intervalControl);
                            if(mission.isStarted()){
                                gyro.reboot();
                                mission.complete();
                                broadcastMissionComplete();
                            }
                        }
                        tick++ ;
                    },delay);
                    
                },(success)=>{
                    if(success&&cb){
                        cb({ok:true,message:'Mission started'})
                        broadcastMissionStatus(mission.currentMission().name,{status:'started'});    
                    }
                    if(!success&&cb){
                        cb({ok:true,message:'Failed to start mission'});
                        broadcastMissionStatus(mission.currentMission().name,{status:'Failed to start mission'});   
                    }
                });
            }else{
                if(cb)cb({ok:false,message:'invalid call to start mission'})
            }
        });
        
        client.on('mission-abort',function(cb){
            mission.abort(()=>{
                if(mission.isStarted()){
                    motor.haltAll(()=>{
                        setTimeout(()=>{
                            gyro.reboot();
                            broadcastMissionStatus(mission.currentMission().name,{status:'Aborted Mission'});   
                        },1000);
                    });
                }else{
                    broadcastMissionStatus('NoMission',{status:'No mission to abort'});  
                }
            },(success)=>{
                if(success&&cb){
                    cb({ok:true,message:'Mission aborted'});
                    broadcastMissionStatus(mission.currentMission().name,{status:'Aborting Mission'});
                }
                if(!success&&cb){
                    cb({ok:true,message:'Failed to abort the mission'});
                    broadcastMissionStatus(mission.currentMission().name,{status:'Abort Requested'});   
                }
                 
            });
        });

        client.on('disconnect', function() { i--; }); 
    }
};
