var exec = require('child_process').exec;
const config = {
    gap : 500
}
let expo = {
    interval : null,
    open : ( onReadings )=>{
        console.log('opening IR hardware : done')
        expo.interval = setInterval(()=>{
            exec('sudo ./../gyro/pulse', function(error, stdout, stderr) {
               // console.log(stdout);
                onReadings(stdout);
            });
        },config.gap);
    },
    close : ()=>{
        clearInterval(ir.interval);
    },
}

module.exports = expo ;

// expo.open((value)=>{
//     console.log(value);
// });