var gpio = require("pi-gpio");

gpio.open(10, "input", function(err) {		// Open pin 16 for input
    gpio.read(10, function(err, value) {
        if(err) throw err;
            console.log(value);	// The current state of the pin
    }); 
});