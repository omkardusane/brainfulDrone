let motor = null;
let i=0;
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
        
        client.on('stop-motor', function(data) {
            console.log('stop-motor');
            motor.haltAll();
            statusUpdate('Stopped');          
        });

        client.on('speed-motor', function(data) {
            console.log("speed-motor ",data)
            if(data.payload.motorNumber != undefined && data.payload.value!= undefined){
               motor.throttle(Number(data.payload.motorNumber),Number(data.payload.value));
            }else{
               console.log("Error in receiving data");
            }
        });
        
        client.on('disconnect', function() { i--; }); 
    }
};
