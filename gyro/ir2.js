var exec = require('child_process').exec;

exec('sudo ./pulse', function(error, stdout, stderr) {
    console.log(stdout);
});