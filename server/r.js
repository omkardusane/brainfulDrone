var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var ip = require('ip');


let PORT = 9000 ,CAM_PORT = 9001;

const config = require('./modules/config.js');
const mocks = require('./modules/mocks.nonPi.js');

let motor = config.isPi? require('./modules/PCA9685-i2cMotorInterface.js'):mocks.motor;
let gyro = config.isPi? require('./modules/gyro-shim.js'):mocks.gyro;
let camera = config.isPi? require('./../cam/camstreamer.js'):null;

//let socketHandleV1 =  require('./modules/v1.js') ;
//let socketHandleV2 =  require('./modules/v2.js') ;
let socketHandleV3 =  require('./modules/v3.js') ;

let currentHandler = socketHandleV3 ;
currentHandler.setReferences(io,motor,gyro, function(){
    camera.start(CAM_PORT);
});

motor.init(()=>{
    camera.startFailSafe(CAM_PORT,1);
    config.camStreamSrc = 'http://'+ip.address()+':'+CAM_PORT+'/?action=stream';
        console.log('Rutvik Stream at : '+config.camStreamSrc);
    
    app.use(express.static(__dirname + '/public'));  
    server.listen(PORT,()=>{
        console.log('Rutvik Server at : http://'+ip.address()+':'+PORT);    
        gyro.init();
        io.on('connection', currentHandler.socketHandle);
    });
});
