const config = require('./modules/config.js');
const mocks = require('./modules/mocks.nonPi.js');

var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var ip = require('ip');

let PORT = 9000 ;

let motor = config.isPi? require('./modules/motor-shim.js'):mocks.motor;
let gyro = config.isPi? require('./modules/gyro-shim.js'):mocks.gyro;

app.use(express.static(__dirname + '/public'));  
app.get('/', function(req, res,next) {      
    res.sendFile(__dirname + '/public/index.html');
});
let i=0;



io.on('connection', function(client) {  
    i++;
    let statusUpdate = (status)=>{
        client.emit('motor-status', status);
    }
    let tellClient = (msg)=>{
        client.emit('msg-client', msg);
    }
    console.log('Clients connected '+i);
   
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
        motor.throttle('all',9,res,()=>{
            if(res.ok){
                statusUpdate('Motors Ready');        
            }else{
                statusUpdate('Issue initializing the Motors');
            }
        });
    });

    client.on('stop-motor', function(data) {
        console.log(data);
        motor.throttle('all',9,res,()=>{
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
            //motor.all.throttle = val;
            motor.throttle('all',val,res,()=>{
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
});

motor.init(()=>{
    server.listen(PORT,()=>{
        console.log('Rutvik Server Running on: http://'+ip.address()+':'+PORT);    
    });
});
