let motor = null;
let gyro = null;
let ir = require('./../../proximity_sensor/ir-prox2')
let cameraTroubleShoot = null;
let i=0;
let maxThrottleAllowed = 580; 
let config = require('./config');
let io = null ;

let speeds = {max : 120 , off : 30 , min : 50};

let auto_stability_times = { delay : 250 , out : 300 };
let auto_stability_speeds = { off : 30 , min : 40 , mid : 60 , max :90 , minIncr : 18 , midIncr: 30 , maxIncr : 50 };
let auto_stability_controller = { on :false , intervalObject: null};

var throttleDelays = 500 ;

const mission = require('./mission');
let ir_dummy = {
    interval : null,
    open :(onReadings)=>{
        ir.interval = setInterval(()=>{
            require('child_process').exec('sudo ./modules/pulse', function(error, stdout, stderr) {
                console.log(error,stdout,stderr);
                //onReadings(stdout);
            });
        },500);
    },
    close :()=>{clearInterval(ir.interval);}
}

module.exports =  {
    
    setReferences: (socketIo,m,g,cameraTroubleShootFunction)=>{
        io = socketIo;
        motor = m ;
        gyro = g ;
        cameraTroubleShoot = cameraTroubleShootFunction;
        ir.open((value)=>{
            //console.log('ir value ',value);
            io.sockets.emit('ir-status',value);
        });
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
                mission.selectMission(data,params);
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
            console.log('Mission Start : ',mission.currentMission());
            if(mission.isReady() && !!mission.currentMission() ){
                mission.startMission(()=>{
                    let speed = 100 / mission.currentMission().attr.time ; // millis
                    let delay = 500 ;
                    let distance = 0 ;
                    let tick =  0 ;
                    let ticks =  mission.currentMission().attr.time / delay ;
                    let checkPoints = [] ;

                    console.log('in start tick '+tick ,' / '+ticks);
                    console.log('in start Time  '+mission.currentMission().attr.time ,' is ', typeof mission.currentMission().attr.time);
                    console.log('TickSpeed Perc  '+speed);
                    console.log('isStarted ---- '+mission.isStarted());
                

                    if(mission.currentMission().type == 2) // CIRCLE
                    {
                        distance = (44*(mission.currentMission().attr.radius)/7);
                        checkPoints = [1 , ticks];
                    }
                    else if(mission.currentMission().type == 3)// SQUARE
                    {
                        distance = (4*(mission.currentMission().attr.side));
                        checkPoints = [0 , (ticks/4) , (ticks/2) , (3*ticks/4) , ticks];
                    }
                    console.log('intervals checkPoints ',checkPoints);

                    let intervalControl = setInterval(()=>{
                        if(tick <= ticks && mission.isStarted()){
                            mission.progress += (delay*speed);
                            if(mission.progress>100){
                                mission.progress = 100;
                            }
                            let currTask = 'Straight Going Ahead' ;
                            if(mission.currentMission().type == 3) // CIRCLE
                            {
                                let lock = 0 ;
                                checkPoints.forEach((t,index) =>{
                                    console.log('tick '+t,' ')
                                    if(tick == t){
                                        if(index ==0 && (lock==0)){ // 0%
                                            lock=1;
                                            currTask = 'Front Yaw - Back lift';
                                            motor.multiThrottle([1,2,3,4],[speeds.max,speeds.off,speeds.off,speeds.max]);
                                            setTimeout(()=>{
                                                motor.allThrottle(speeds.min);
                                            },throttleDelays);
                                        }
                                        else if((index == 1 || index ==2 || index ==3)&& (lock==0)){ // 25% and 50% and 75%
                                            lock=1;
                                            currTask = 'Right Roll - Left lift';
                                            motor.multiThrottle([1,2,3,4],[speeds.max,speeds.off,speeds.off,speeds.off]);
                                            setTimeout(()=>{
                                                motor.multiThrottle([1,2,3,4],[speeds.max,speeds.max,speeds.off,speeds.off]);
                                                setTimeout(()=>{
                                                     motor.allThrottle(speeds.min);
                                                },throttleDelays);
                                            },throttleDelays);
                                        }
                                        else if(index ==4 && (lock ==0)){ // 100%
                                            lock=1;
                                            motor.multiThrottle([1,2,3,4],[speeds.off,speeds.max,speeds.max,speeds.off]);
                                            currTask = 'Back Yaw - front lift';
                                            setTimeout(()=>{
                                                motor.haltAll();
                                            },throttleDelays);
                                        }
                                    }
                                })
                            }
                            if(mission.currentMission().type == 2) // CIRCLE
                            {
                                checkPoints.forEach((t,index) =>{
                                    if(tick == t){
                                        if(index==0){ // 0%
                                            currTask = 'sdjfghj';
                                            motor.multiThrottle([1,2,3,4],[speeds.max,speeds.off,speeds.off,speeds.off]);
                                            setTimeout(()=>{
                                                motor.multiThrottle([1,2,3,4],[speeds.max,speeds.max,speeds.min,speeds.min]);
                                                setTimeout(()=>{
                                                     motor.allThrottle(speeds.min);
                                                },throttleDelays);
                                            },throttleDelays);
                                        }else if(index == 1 ){ // 25%
                                            currTask = 'jksdfbkjdh';
                                            
                                            motor.multiThrottle([1,2,3,4],[speeds.off,speeds.off,speeds.off,speeds.max]);
                                            setTimeout(()=>{
                                                motor.haltAll();
                                            },throttleDelays);
                                        }
                                    }
                                })
                            }
                            let eventNow = {
                                progress : mission.progress ,
                                task : currTask,
                            };
                            broadcastMissionProgress(mission.currentMission().name,eventNow);
                            console.log("Tick : ",tick, " / ",ticks ,': ',eventNow);
    
                        }else{
                            clearInterval(intervalControl);
                            if(mission.isStarted()){
                                console.log('mission complete')
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
            console.log('Mission abort : ',mission.currentMission());
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

        client.on('auto-stability',function(){
            /**
             * y - means back up
             * y + means front up
             * 
             * x - means left up
             * x + means right up
             * 
             * z + means rght back
             * 
             */
            motor.haltAll();
            let intervalHandler = ()=>{
                let d = gyro.currentReadings;
                if(d && auto_stability_controller.on){
                    let y = d.y;
                    
                    let newSpeeds = [auto_stability_speeds.off,auto_stability_speeds.off,auto_stability_speeds.off,auto_stability_speeds.off] ;
                    if(y>30){ // add 1 and 4 to lift back up
                        newSpeeds[0]+= auto_stability_speeds.maxIncr ;
                        newSpeeds[3]+= auto_stability_speeds.maxIncr ;
                    }else if(y>20){
                        newSpeeds[0]+= auto_stability_speeds.midIncr ;
                        newSpeeds[3]+= auto_stability_speeds.midIncr ;
                    }else if(y>12){
                        newSpeeds[0]+= auto_stability_speeds.minIncr ;
                        newSpeeds[3]+= auto_stability_speeds.minIncr ;
                    }else if(y<=12 && y>=-12 ){ 
                        // nothing
                    }else if(y>-20){    
                        newSpeeds[1]+= auto_stability_speeds.minIncr ;
                        newSpeeds[2]+= auto_stability_speeds.minIncr ;
                    }else if(y>-30){
                        newSpeeds[1]+= auto_stability_speeds.midIncr ;
                        newSpeeds[2]+= auto_stability_speeds.midIncr ;
                    }else if(y<-30){
                        newSpeeds[1]+= auto_stability_speeds.maxIncr ;
                        newSpeeds[2]+= auto_stability_speeds.maxIncr ;
                    }

                    y = d.x;
                    if(y>30){ // ad to motor 1 and 2 to lift LEFT
                        newSpeeds[0]+= auto_stability_speeds.maxIncr ;
                        newSpeeds[1]+= auto_stability_speeds.maxIncr ;
                    }else if(y>20){
                        newSpeeds[0]+= auto_stability_speeds.midIncr ;
                        newSpeeds[1]+= auto_stability_speeds.midIncr ;
                    }else if(y>12){
                        newSpeeds[0]+= auto_stability_speeds.minIncr ;
                        newSpeeds[1]+= auto_stability_speeds.minIncr ;
                    }else if(y<=12 && y>=-12 ){ 
                        // nothing
                    }else if(y>-20){    
                        newSpeeds[3]+= auto_stability_speeds.minIncr ;
                        newSpeeds[2]+= auto_stability_speeds.minIncr ;
                    }else if(y>-30){
                        newSpeeds[3]+= auto_stability_speeds.midIncr ;
                        newSpeeds[2]+= auto_stability_speeds.midIncr ;
                    }else if(y<-30){
                        newSpeeds[3]+= auto_stability_speeds.maxIncr ;
                        newSpeeds[2]+= auto_stability_speeds.maxIncr ;
                    }

                    // APPLY the changes

                    motor.multiThrottle([1,2,3,4],newSpeeds);

                    // if(y>20){
                    //   motor.multiThrottle([1,4],[auto_stability_speeds.max,auto_stability_speeds.max]);
                    //   motor.multiThrottle([2,3],[auto_stability_speeds.min,auto_stability_speeds.min]);
                    // }else if(y>10){
                    //   motor.multiThrottle([1,4],[auto_stability_speeds.mid,auto_stability_speeds.mid]);
                    //   motor.multiThrottle([2,3],[auto_stability_speeds.min,auto_stability_speeds.min]);
                    // }else if(y>0){
                    //   motor.multiThrottle([1,4],[auto_stability_speeds.min,auto_stability_speeds.min]);
                    //   motor.multiThrottle([2,3],[auto_stability_speeds.min,auto_stability_speeds.min]);
                    // }else if(y>=-10){
                    //   motor.multiThrottle([1,4],[auto_stability_speeds.min,auto_stability_speeds.min]);
                    //   motor.multiThrottle([2,3],[auto_stability_speeds.mid,auto_stability_speeds.mid]);
                    // }else if(y<-10){
                    //   motor.multiThrottle([1,4],[auto_stability_speeds.min,auto_stability_speeds.min]);
                    //   motor.multiThrottle([2,3],[auto_stability_speeds.max,auto_stability_speeds.max]);
                    // }

                }else{
                       motor.haltAll();
                }
            };
            auto_stability_controller.on = true ;
            auto_stability_controller.intervalObject = setInterval(intervalHandler, auto_stability_times.delay );
        });

        client.on('auto-stability-off',function(){
            auto_stability_controller.on = false;
            clearInterval(auto_stability_controller.intervalObject);
            motor.haltAll();
        });

    }

};
