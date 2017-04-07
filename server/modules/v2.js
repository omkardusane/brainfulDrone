let motor = null;
let i=0;
let all = ['1','2','3','4'];

module.exports =  {
    setReferences: (m)=>{
        motor = m ;
    },
    socketHandle : function(client) {  
        console.log('Clients connected '+i);
        i++;
        let statusUpdate = (status)=>{
            client.emit('motor-status', status);
        }
        let tellClient = (msg)=>{
            client.emit('msg-client', msg);
        }
    
        client.on('msg', function(data) {
            console.log(data);
        });
        
        client.on('msg-motor', function(data) {
            console.log(data);
            if(data.auto == '1'){
                motor.auto = true;
            }else if(data.auto == '0'){
                motor.auto = false;
            }

        });

        client.on('init-motor', function(data) {
            console.log(data);
            res = {};
            motor.multiThrottle(9,res,()=>{
                if(res.ok){
                    statusUpdate('Motors Ready');        
                }else{
                    statusUpdate('Issue initializing the Motors');
                }
            });
        });

        client.on('stop-motor', function(data) {
            console.log(data);
            res = {};
            motor.multiThrottle(all,9,res,()=>{
                if(res.ok){
                    statusUpdate('Stopped');        
                }else{
                    statusUpdate('Issue stopping the Motor');
                }
            });
        });

        client.on('speed-motor', function(data) {
            if(isNaN(data.payload)==false){
                let val = Number(data.payload);
                res = {};
                motor.multiThrottle(all,val,res,()=>{
                    console.log('Throttle set to '+val)
                    if(!res.ok){
                        statusUpdate('Last Throttle invalid')
                    }else if(val==9){
                        statusUpdate('Started , increase throttle from below');
                    }else{
                        statusUpdate('Throttle is '+val);
                    }
                });
            }
        });
        
        client.on('disconnect', function() { i--; }); 
    }
};
