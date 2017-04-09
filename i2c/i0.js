var i2c = require('i2c');
var address = 0x10;
var wire = new i2c(address, {device: '/dev/i2c-1'}); // point to your i2c address, debug provides REPL interface 
 
// wire.scan(function(err, data) {
//     console.log("data in scan : ",data);
// //    wire.write(JSON.stringify(o));
// });

//let o = {pin:process.argv[2], speed: process.argv[3]};
//console.log(o);
//wire.write(JSON.stringify(o), function(err) {});

let arr = [102,100] ;
wire.write(arr,function(err) {
    console.log('sent : ',arr);
});

// wire.write([102,80],
//  function(err) {
//     console.log('sent');
// });



 
wire.on('data', function(data) {
   // result for continuous stream contains data buffer, address, length, timestamp 
   console.log('data');
});
 
 
//wire.write([byte0, byte1], function(err) {});
 
// wire.read(100, function(err, res) {
//   // result contains a buffer of bytes 
//   console.log('Res in read: ',res);
// });