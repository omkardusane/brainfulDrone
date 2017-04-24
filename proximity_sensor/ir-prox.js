const ir = require('./build/Release/pi-ir-proxensor');
const config = {
    gap : 100
}
let expo = {
    interval : null,
    open : ( onReadings )=>{
        ir.interval = setInterval(()=>{
            onReadings(ir.getReading());
        },config.gap);
    },
    close : ()=>{
        clearInterval(ir.interval);
    },
}

module.exports = expo ;

expo.open((value)=>{
    console.log(value);
});