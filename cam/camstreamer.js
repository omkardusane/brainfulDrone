var exec = require('child_process').exec;
let count = 0 , maxTry = 3  ;
module.exports  = {
    start:(port,onError,next)=>{
        let camCommand = 
        'sudo mjpg_streamer -i "/usr/lib/input_uvc.so -d /dev/video0 -y -r 640x480 -f 10" -o "/usr/lib/output_http.so -p '
        +port+
        ' -w /var/www/mjpg_streamer"';
        exec(camCommand , function(error, stdout, stderr) {
            console.log('Camera module running at port: ',port);
            if (error !== null) {
                if(onError){
                   onError(error);
                }else{
                    console.log('Camera module exec error');
                }
            }
            if(next)
                next();
        });
    },
    startFailSafe:(port,maxtry,next)=>{
        if (maxtry>=1 && maxtry<=100){
            maxTry = maxtry ;
        }
        module.exports.start(port,err=>{
            console.log('Camera module exec error: ',count,(new Date().getTime())/1000);
            if(count < maxTry ){
                require('sleep').sleep(1)
                module.exports.startFailSafe(port,next);
                count++ ;
            }else{
                console.log('reached retry limit '+maxTry,' : Camera may be down');
            }
        },()=>{if(next)next()});
    }
}
//module.exports.start(8090);
//module.exports.startFailSafe(8090,9);

