var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var ip = require('ip');

let PORT = 9000 ;

const config = require('./modules/config.js');
const mocks = require('./modules/mocks.nonPi.js');

let motor = config.isPi? require('./modules/PCA9685-i2cMotorInterface.js'):mocks.motor;
let gyro = config.isPi? require('./modules/gyro-shim.js'):mocks.gyro;

//let socketHandleV1 =  require('./modules/v1.js') ;
//let socketHandleV2 =  require('./modules/v2.js') ;
let socketHandleV3 =  require('./modules/v3.js') ;

let socketHandle = socketHandleV3 ;
socketHandle.setReferences(motor);
io.on('connection', socketHandle.socketHandle);

motor.init(()=>{
    app.use(express.static(__dirname + '/public'));  
    app.get('/', function(req, res,next) {      
        res.sendFile(__dirname + '/public/index.html');
    });
    server.listen(PORT,()=>{
        console.log('Rutvik Server Running on: http://'+ip.address()+':'+PORT);    
    });
});
