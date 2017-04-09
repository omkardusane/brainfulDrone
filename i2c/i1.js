var i2c = require('i2c');
var address = 0x10;
var wire = new i2c(address, {device: '/dev/i2c-1'}); // point to your i2c address, debug provides REPL interface 
 
let arr = [102,0] ;
wire.write(arr,function(err) {
    console.log('sent : ',arr);
});
