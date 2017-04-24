var i2c = require('i2c'); 
const config = require('./config.js');

let self ={
    auto : false,
    address : config.motorAddress ,
    wire : null,
    init : (next)=>{
        self.wire = new i2c(self.address, {device: '/dev/i2c-1'});
        let arr = [102,1] ;
        self.wire.write(arr,function(err) {
            console.log('Initialized motors: ',arr);
            if(next) next();
        });
        next();
    },
    testInit:(allOne,next)=>{
       next();
    },
    haltAll:(next)=>{
        let arr = [102,1] ;
        self.wire.write(arr,function(err) {
            console.log('Sent to Motors : ',arr);
             if(next) next();
        });
    },
    throttle:(selected,speed,next)=>{
        let arr = [101,selected,speed] ;
        self.wire.write(arr,function(err) {
            console.log('throttle Sent to Motor : ',selected,": speed ",speed);
            if(next) next();
        });
    },
    multiThrottle:(selected,speeds,next)=>{
        let arr = [101] ;
        selected.forEach((obj,index)=>{
            arr.push(obj);
            arr.push(speeds[index]);
        });
        self.wire.write(arr,function(err) {
            console.log('multiThrottle Sent to Motors : ',arr);
             if(next) next();
        });
    },    
    allThrottle:(speed,next)=>{
        let arr = [102] ;
        arr.push(speed);
        self.wire.write(arr,function(err) {
            console.log('allThrottle Sent to Motors , speed is ',speed);
            if(next) next();
        });
    },    
}

module.exports = self ;