var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var ip = require('ip');

let PORT = 9000 ;

const config = require('./modules/config.js');
const mocks = require('./modules/mocks.nonPi.js');

let motor = config.isPi? require('./modules/motor-shim.js'):mocks.motor;
let gyro = config.isPi? require('./modules/gyro-shim.js'):mocks.gyro;

let socketHandleV1 =  require('./modules/v1.js') ;
let socketHandleV1 =  require('./modules/v2.js') ;

let socketHandle = socketHandleV1 ;
socketHandle.setReferences(motor);
io.on('connection', socketHandle);

motor.init(()=>{
    app.use(express.static(__dirname + '/public'));  
    app.get('/', function(req, res,next) {      
        res.sendFile(__dirname + '/public/index.html');
    });
    server.listen(PORT,()=>{
        console.log('Rutvik Server Running on: http://'+ip.address()+':'+PORT);    
    });
});
