let app = angular.module('rutvik',['ngRoute','ngMaterial']);
var socket = io.connect(window.location.host);
var mc = null ; 

app.config(function($routeProvider) {
    $routeProvider
    .when("/gyro", {
        templateUrl: 'pages/gyro.html',
        controller: 'gyroCtrl'
    })
    .when("/device", {
        templateUrl: 'pages/device.html',
        controller: 'deviceCtrl'
    })
    .when("/", {
        templateUrl: 'pages/main.html',
        controller: 'main'
    })
    .when("/mission", {
        templateUrl: 'pages/mission.html',
        controller: 'MissionCtrl'
    })
    .when("/motors", {
        templateUrl: 'pages/motor_control.html',
        controller: 'MotorControlCtrl'
    })    
    ;
});

app.controller('main',function($scope){
    window.location = "#motors"
})  
app.controller('deviceCtrl',function($scope){
   $scope.shutdown =  function(){
     socket.emit('shutdown-67rq3d2bo1iwcefl');
   };
})  

app.controller('MissionCtrl',function($scope){
    socket.emit('get-video-stream',function(streamSrc){
        let element = '<img id="mainVid" src="'+streamSrc+'" width="640">';
        document.getElementById("missionVideoPanel").innerHTML =  element ;
    });
})  

app.controller('gyroCtrl',function($scope){
    console.log('gyroCtrl loaded')
    $scope.curr = {x:98,y:10,z :12};
    socket.emit('start-gyro-stream');
    socket.on('gyro-stream-in',function(readings){
        console.log(readings, ' -> readings came in at: ', (new Date().getTime())/1000);
        $scope.curr = readings ;
        processGyro($scope.curr.x,$scope.curr.y,$scope.curr.z); 
        $scope.$digest();
    });

    var gyro=quatFromAxisAngle(0,0,0,0);

    //get orientation info, rolling back if gyro info not available

    function processGyro(alpha,beta,gamma)
    {   
        document.getElementById("alpha").innerHTML=alpha.toFixed(5);
        document.getElementById("beta").innerHTML=beta.toFixed(5);
        document.getElementById("gamma").innerHTML =gamma.toFixed(5);
        
        gyro=computeQuaternionFromEulers(alpha,beta,gamma);
          
         document.getElementById("x").innerHTML=gyro.x.toFixed(5);
         document.getElementById("y").innerHTML=gyro.y.toFixed(5);
         document.getElementById("z").innerHTML=gyro.z.toFixed(5);
         document.getElementById("w").innerHTML=gyro.w.toFixed(5);
    }
        

    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    context.canvas.width  = window.innerWidth;//resize canvas to whatever window dimensions are
    context.canvas.height = window.innerHeight;
    context.translate(canvas.width / 2, canvas.height / 2); //put 0,0,0 origin at center of screen instead of upper left corner



    function computeQuaternionFromEulers(alpha,beta,gamma)//Alpha around Z axis, beta around X axis and gamma around Y axis intrinsic local space in that order(each axis moves depending on how the other moves so processing order is important)
    {
        var x = degToRad(beta) ; // beta value
        var y = degToRad(gamma) ; // gamma value
        var z = degToRad(alpha) ; // alpha value

        //precompute to save on processing time
        var cX = Math.cos( x/2 );
        var cY = Math.cos( y/2 );
        var cZ = Math.cos( z/2 );
        var sX = Math.sin( x/2 );
        var sY = Math.sin( y/2 );
        var sZ = Math.sin( z/2 );

        var w = cX * cY * cZ - sX * sY * sZ;
        var x = sX * cY * cZ - cX * sY * sZ;
        var y = cX * sY * cZ + sX * cY * sZ;
        var z = cX * cY * sZ + sX * sY * cZ;

        return makeQuat(x,y,z,w);     
    }

    function quaternionMultiply(quaternionArray)// multiplies 2 or more quatoernions together (remember order is important although the code goes from first to last the way to think about the rotations is last to first)
    {   
        //var qSoFar = quaternionArray[quaternionArray.length-1];//javascript passes objects by reference so this is troublesome
        var temp = quaternionArray[0];
        var qSoFar ={x:temp.x,y:temp.y,z:temp.z,w:temp.w}; //must copy to not alter original object
        for(var i=1 ;i < quaternionArray.length ;i ++)
        {
            var temp2=quaternionArray[i];
            var next={x:temp2.x,y:temp2.y,z:temp2.z,w:temp2.w};
            //ww,x,y,z
            var w = qSoFar.w * next.w - qSoFar.x * next.x - qSoFar.y * next.y - qSoFar.z * next.z;
            var x = qSoFar.x * next.w + qSoFar.w * next.x + qSoFar.y * next.z - qSoFar.z * next.y;
            var y = qSoFar.y * next.w + qSoFar.w * next.y + qSoFar.z * next.x - qSoFar.x * next.z;
            var z = qSoFar.z * next.w + qSoFar.w * next.z + qSoFar.x * next.y - qSoFar.y * next.x;
            
            qSoFar.x=x;
            qSoFar.y=y;
            qSoFar.z=z;
            qSoFar.w=w;
        }
        
        return qSoFar;
    }

    function inverseQuaternion(q)
    {
        return makeQuat(q.x,q.y,q.z,-q.w);
    }

    function degToRad(deg)// Degree-to-Radian conversion
    {
         return deg * Math.PI / 180; 
    }

    function makeRect(width,height,depth)//returns a 3D box like object centered around the origin. There are more than 8 points for this cube as it is being made by chaining together a strip of triangles so points are redundant at least 3x. Confusing for now (sorry) but this odd structure comes in handy later for transitioning into webgl
    {
        var newObj={};
        var hw=width/2;
        var hh=height/2;
        var hd=depth/2;
        newObj.vertices=[  [-hw,hh,hd],[hw,hh,hd],[hw,-hh,hd],//first triangle
                          [-hw,hh,hd],[-hw,-hh,hd],[hw,-hh,hd],//2 triangles make front side
                          [-hw,hh,-hd],[-hw,hh,hd],[-hw,-hh,-hd], //left side
                          [-hw,hh,hd],[-hw,-hh,hd],[-hw,-hh,-hd],
                          [hw,hh,-hd],[hw,hh,hd],[hw,-hh,-hd], //right side
                          [hw,hh,hd],[hw,-hh,hd],[hw,-hh,-hd],
                          [-hw,hh,-hd],[hw,hh,-hd],[hw,-hh,-hd],//back
                          [-hw,hh,-hd],[-hw,-hh,-hd],[hw,-hh,-hd],
                          [-hw,hh,-hd],[hw,hh,-hd],[hw,hh,hd],//top
                          [-hw,hh,-hd],[-hw,hh,hd],[hw,hh,hd],
                          [-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],//bottom
                          [-hw,-hh,-hd],[-hw,-hh,hd],[hw,-hh,hd]
        ];
        
        return newObj;
    }

    var cube=makeRect(canvas.width/5,canvas.width/5,canvas.width/5);
    cube.color="purple";
    var xAxis=makeRect(440,10,10);
    xAxis.color="green";
    var yAxis=makeRect(10,440,10);
    yAxis.color="red";
    var zAxis=makeRect(10,10,440);
    zAxis.color="blue";



    function renderObj(obj,q)//renders an object as a series of triangles
    {
        var rotatedObj=rotateObject(obj,q);
        context.lineWidth = 1;
        context.strokeStyle = obj.color;
        
        function scaleByZ(val,z)
        {
            var focalLength=900; //should probably be a global but oh well
            var scale= focalLength/((-z)+focalLength);
            return val*scale;
        }
        
        for(var i=0 ; i<obj.vertices.length ; i+=3)
        {
            for (var k=0;k<3;k++)
            {
              var vertexFrom=rotatedObj.vertices[i+k];
              var temp=i+k+1;
              if(k==2) 
                  temp=i;
                  
              var vertexTo=rotatedObj.vertices[temp];       
              context.beginPath();
              context.moveTo(scaleByZ(vertexFrom[0],vertexFrom[2]), ( -scaleByZ(vertexFrom[1],vertexFrom[2])));
              context.lineTo(scaleByZ(vertexTo[0],vertexTo[2]), ( -scaleByZ(vertexTo[1],vertexTo[2])));
              context.stroke();
            }
        }
    }

    function rotateObject(obj,q) //object , quternion to rotate rotates obeject
    {
        var newObj={};
        newObj.vertices=[];
        
        for(var i=0 ; i<obj.vertices.length ; i++)
        {
          newObj.vertices.push(rotatePointViaQuaternion(obj.vertices[i],q));
        }
        return newObj;
    }

    function rotatePointViaQuaternion(pointRa,q)
    {
        var tempQuot = {'x':pointRa[0], 'y':pointRa[1], 'z':pointRa[2], 'w':0 };
        var rotatedPoint=quaternionMultiply([ q , tempQuot, conjugateQuot(q)]);//inverseQuaternion(q) also works 

        return [rotatedPoint.x,rotatedPoint.y,rotatedPoint.z];
        
        function conjugateQuot(qq)
        {
            return makeQuat(-qq.x,-qq.y,-qq.z,qq.w);//return {"x":-qq.x,"y":-qq.y,"z":-qq.z,"w": qq.w};
        }
    }
          
          
    ////////////user input////////////////////
    var userQuat=quatFromAxisAngle(0,0,0,0);//a quaternion to represent the users finger swipe movement - default is no rotation
    var prevTouchX = -1; // -1 is flag for no previous touch info
    var prevTouchY = -1;

    //touch
    document.addEventListener("touchStart", touchStartFunc, true);//?misspelled
    document.addEventListener("touchmove", touchmoveFunc, true);
    document.addEventListener("touchend", touchEndFunc, true);


    function touchStartFunc(e)
    {
        prevTouchY=e.touches[0].clientY;
        prevTouchX=e.touches[0].clientX;
    }

    function touchmoveFunc(e)
    {
        if( navigator.userAgent.match(/Android/i) ) //stupid android bug cancels touch move if it thinks there's a swipe happening
        {   
          e.preventDefault();
        }
        userXYmove(e.touches[0].clientX,e.touches[0].clientY);
    }

    function touchEndFunc(e)
    {
      prevTouchX = -1;
      prevTouchY = -1;
    }

    //add minimal mouse support too
    document.addEventListener("mousedown", mouseDownFunc, true);
    document.addEventListener("mousemove", mouseMoveFunc, true);
    document.addEventListener("mouseup", mouseUpFunc, true);

    function mouseDownFunc(e)
    {
      prevTouchX = e.clientX;
      prevTouchY = e.clientY;
    }

    function mouseMoveFunc(e)
    {
        if (prevTouchX!= -1)
            userXYmove(e.clientX,e.clientY);
    }

    function mouseUpFunc(e)
    {
      prevTouchX = -1;
      prevTouchY = -1;
    }


        
    function userXYmove(x,y)
    {

        document.getElementById("userX").innerHTML=x;
        document.getElementById("userY").innerHTML=y;
        
        if(prevTouchX != -1 ) //need valid prevTouch info to calculate swipe
        {
          var xMovement=x-prevTouchX;
          var yMovement=y-prevTouchY;
          //var xMovementQuat=quatFromAxisAngle(1,0,0,y/200);//movement on y rotates x and vice versa
          //var yMovementQuat=quatFromAxisAngle(0,1,0,x/200);//200 is there to scale the movement way down to an intuitive amount
         //userQuot=quaternionMultiply([yMovementQuat,xMovementQuat]);//use reverse order
         
         
         var xMovementQuat=quatFromAxisAngle(1,0,0,yMovement/200);//movement on y rotates x and vice versa
         var yMovementQuat=quatFromAxisAngle(0,1,0,xMovement/200);//200 is there to scale the movement way down to an intuitive amount   
          userQuat=quaternionMultiply([gyro,yMovementQuat,xMovementQuat,inverseQuaternion(gyro),userQuat]);//use reverse order

        }
        prevTouchY=y;
        prevTouchX=x;
    }

    function makeQuat(x,y,z,w)//simple utitlity to make quaternion object
    {
        return  {"x":x,"y":y,"z":z,"w":w};
    }

    function quatFromAxisAngle(x,y,z,angle)
    {
        var q={};
        var half_angle = angle/2;
        q.x = x * Math.sin(half_angle);
        q.y = y * Math.sin(half_angle);
        q.z = z * Math.sin(half_angle);
        q.w = Math.cos(half_angle);
        return q;
    }
        //render loop
    function renderLoop() 
    {
      requestAnimationFrame( renderLoop );//better than set interval as it pauses when browser isn't active
      //context.clearRect(0, 0, canvas.width, canvas.height);//clear screen
      context.clearRect( -canvas.width/2, -canvas.height/2, canvas.width, canvas.height);//clear screen x, y, width, height
      
      //create some fake data in case web page isn't being accessed from a mobile or gyro enabled device
      renderObj(cube,quaternionMultiply([inverseQuaternion(gyro),userQuat]));
      renderObj(xAxis,inverseQuaternion(gyro));
      renderObj(yAxis,inverseQuaternion(gyro));
      renderObj(zAxis,inverseQuaternion(gyro));
    }
    renderLoop();

});

app.directive("mdNumPicker", function(){
    return {
            restrict: 'EC',
            controller: function($scope){
                console.log('Loaded directive Ctrl')
                $scope.stop = ()=>{
                // $scope.state.started= false;
                    socket.emit('stop-motor', {message:'stop motor'});
                }            
            $scope.incVal = function(){
                // $scope.animateUp = false;
                if(angular.isNumber($scope.val)){
                    if(!angular.isUndefined($scope.maxValue) && $scope.val>=$scope.maxValue){
                    return;
                    };
                    $scope.val = $scope.val + parseInt($scope.$parent.deltaValue);
                    if($scope.name.includes(":")){ 
                        $scope.$parent.sendDualMotorValue($scope.name.split(":")[0],$scope.name.split(":")[1],$scope.val);
                        if($scope.name.split(":")[1] == "3"){
                            $scope.$parent.value3 = $scope.val;
                        }else if($scope.name.split(":")[1] == "4"){
                            $scope.$parent.value4 = $scope.val;
                        }
                    }else{
                        $scope.$parent.sendValue($scope.name,$scope.val);
                    }
                    
                    if(!!$scope.onChange){
                    $scope.onChange({value: $scope.val})
                    }
                };
                };
                $scope.decVal = function(){
                // $scope.animateUp = true;
                if(angular.isNumber($scope.val)){
                    if(!angular.isUndefined($scope.minValue) && $scope.val<=$scope.minValue){
                    return;
                    };
                    $scope.val = $scope.val - parseInt($scope.$parent.deltaValue);
                    if($scope.name.includes(":")){ 
                        $scope.$parent.sendDualMotorValue($scope.name.split(":")[0],$scope.name.split(":")[1],$scope.val);
                        if($scope.name.split(":")[1] == "3"){
                            $scope.$parent.value3 = $scope.val;
                        }else if($scope.name.split(":")[1] == "4"){
                            $scope.$parent.value4 = $scope.val;
                        }
                    }else{
                        $scope.$parent.sendValue($scope.name,$scope.val);
                    }

                    $scope.$parent.sendValue($scope.name,$scope.val);
                    if(!!$scope.onChange){
                    $scope.onChange({value: $scope.val})
                    }
                }
                }
                
                $scope.isMinValue = function(){
                if(angular.isNumber($scope.val) && !angular.isUndefined($scope.minValue)
                    && $scope.val <= $scope.minValue){
                    return true;
                };
                
                return false;
                };
                
                $scope.isMaxValue = function(){
                if(angular.isNumber($scope.val) && !angular.isUndefined($scope.maxValue)
                    && $scope.val >= $scope.maxValue){
                    return true;
                };
                
                return false;
                }
                
                $scope.$watch('val', function(newVal, oldVal){
                $scope.animateUp = newVal < oldVal ; 
                });

            },
            scope: {
                val: '=ngModel',
                maxValue: '=*?',
                minValue: '=*?',
                onChange: '&',
                name : '@',   
            },
            template: [
                '<div layout="column" layout-align="center stretch">',
                    '<md-button class="md-raised" ng-click="incVal()" ng-disabled="isMaxValue()">+</md-button>',
                    '<div class="md-num-picker__content md-display-1" ng-class="{\'animate-up\': animateUp}">',
                    '<div ng-animate-swap="val" class="md-num-picker__content-view">{{val}}</div>',
                    '</div>',
                    '<md-button class="md-raised" ng-click="decVal()" ng-disabled="isMinValue()">-</md-button>',
                '</div>'].join(' ').replace(/\s+/g, ' ')
            }
})

app.controller('MotorControlCtrl',function($scope){

            $scope.deltaValue = 1;


            var opts = {
              angle: -0.2, // The span of the gauge arc
              lineWidth: 0.2, // The line thickness
              radiusScale: 1, // Relative radius
              pointer: {
                length: 0.6, // // Relative to gauge radius
                strokeWidth: 0.035, // The thickness
                color: '#000000' // Fill color
              },
              limitMax: false,     // If false, the max value of the gauge will be updated if value surpass max
              limitMin: false,     // If true, the min value of the gauge will be fixed unless you set it manually
              colorStart: '#d9534f',   // Colors
              colorStop: '#5cb85c',    // just experiment with them
              strokeColor: '#E0E0E0',  // to see which ones work best for you
              generateGradient: true,
              highDpiSupport: true     // High resolution support
            };
            var target = document.getElementById('foo'); // your canvas element
            var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
            gauge.maxValue = 90; // set max gauge value
            gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
            gauge.animationSpeed = 32; // set animation speed (32 is default value)

            socket.emit('get-video-stream',function(streamSrc){
                let element = '<img id="mainVid" src="'+streamSrc+'" width="640">';
                document.getElementById("missionVideoPanel").innerHTML =  element ;
            });

            $scope.camt = ()=>{socket.emit('troubleshoot-camera',function(){
                 socket.emit('get-video-stream',function(streamSrc){
                    let element = '<img id="mainVid" src="'+streamSrc+'" width="640">';
                    document.getElementById("missionVideoPanel").innerHTML =  element ;
                });
            })}
            $scope.gt = ()=>{socket.emit('troubleshoot-gyro',function(){
                console.log('Gyro reboot')
            })}
            $scope.globalValueApply = function(){
                $scope.value1 = $scope.value2 = $scope.value3 = $scope.value4 = parseInt($scope.globalValue);
                socket.emit('speed-motor', {payload:{motorNumber : 1, value : $scope.globalValue},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 2, value : $scope.globalValue},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 3, value : $scope.globalValue},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 4, value : $scope.globalValue},message:'speed change'});
            }
            $scope.globalIncrementer = function(){
                $scope.dummyDeltaValue = parseInt($scope.deltaValue);
                $scope.value1 = $scope.value1 + $scope.dummyDeltaValue;
                $scope.value2 = $scope.value2 + $scope.dummyDeltaValue;
                $scope.value3 = $scope.value3 + $scope.dummyDeltaValue;
                $scope.value4 = $scope.value4 + $scope.dummyDeltaValue;
           
                socket.emit('speed-motor', {payload:{motorNumber : 1, value : $scope.value1},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 2, value : $scope.value2},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 3, value : $scope.value3},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 4, value : $scope.value4},message:'speed change'});
            }
            $scope.globalDecrementer = function(){
                $scope.dummyDeltaValue = parseInt($scope.deltaValue);
                $scope.value1 = $scope.value1 - $scope.dummyDeltaValue;
                $scope.value2 = $scope.value2 - $scope.dummyDeltaValue;
                $scope.value3 = $scope.value3 - $scope.dummyDeltaValue;
                $scope.value4 = $scope.value4 - $scope.dummyDeltaValue;
           
                socket.emit('speed-motor', {payload:{motorNumber : 1, value : $scope.value1},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 2, value : $scope.value2},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 3, value : $scope.value3},message:'speed change'});
                socket.emit('speed-motor', {payload:{motorNumber : 4, value : $scope.value4},message:'speed change'});
            }            
            $scope.sendValue = (motorNumber,val)=>{
                socket.emit('speed-motor', {payload:{motorNumber : motorNumber, value : val},message:'speed change'});
            }  
            $scope.sendDualMotorValue = (motorNumber1, motorNumber2,val)=>{
                socket.emit('speed-dual-motor', {payload:{m1 : motorNumber1, m2 : motorNumber2, value : val},message:'speed change'});
            }
            $scope.stop = function(){
                $scope.value1 = $scope.value2 = $scope.value3 = $scope.value4 = 36;
                socket.emit('stop-motor', {message:'stop motor'});
            }

            $scope.curr = {x:0 ,y: 0,z : 0};
            socket.emit('start-gyro-stream');
            socket.on('gyro-stream-in',function(readings){
                //console.log(readings, ' -> readings came in at: ', (new Date().getTime())/1000);
                $scope.curr = readings ;
                if(window.location.hash == "#/motors"){
                    processGyro($scope.curr.x,$scope.curr.y,$scope.curr.z); 
                    $scope.$digest();
                }
            });

            socket.on('ir-status',function(value){
                $scope.proximity = value;
                console.log(typeof $scope.proximity);
            })


            socket.emit('start-thermo-stream');
            socket.on('thermo-stream-in',function(readings){
                if(window.location.hash == "#/motors"){
                    //console.log(readings, ' -> thermo-stream-in at ', (new Date().getTime())/1000);
                    $scope.currTemp = readings ;
                    //console.log($scope.currTemp.celsius);
                    gauge.set($scope.currTemp.celsius);
                    // Update temperature values here
                }

            });

            $scope.stabilityOn = function(){
 				socket.emit('auto-stability');
            }

            $scope.stabilityOff = function(){
				socket.emit('auto-stability-off');
            }
            let missionCtrl = {
                init : function(){
                    socket.on('mission-status',function(missionName,event){
                        console.log('Mission : ',missionName)
                        if(event){
                            console.log('Status : ',event)
                            $scope.status = event.status;
                        }
                    });
                    socket.on('mission-progress',function(missionName,event){ 
                        if(event.progress){
                           // console.log('Progress : ',event.progress)
                            $scope.progress = event.progress; 
                            $scope.currentTask = event.task; 
                            console.log(event.task);                             
                            //console.log('Status : ',event)
                        }
                    });
                    socket.on('mission-complete',function(){
                        console.log('*** mission-complete ***');
                        $scope.status = "Completed";
                    });

                },
                select : function(name,params){
                    // {side:5,time:20000}

                    console.log($scope.sqaureSide);
                    console.log($scope.sqaureDuration);
                    var param = [$scope.sqaureSide,$scope.sqaureDuration];
                    socket.emit('mission-select',name,param);
                },
                start : function(){
                    socket.emit('mission-start',function(msg){
                        $scope.missionInit = true;
                        console.log(msg);
                    });
                },
                abort : function(){
                    socket.emit('mission-abort',function(msg){
                        $scope.missionInit = false;
                        console.log(msg);
                    });
                },

            }

            $scope.missionController = missionCtrl;

            missionCtrl.init();
            mc = missionCtrl ;

            $scope.selectmission = function(name){
                var param = {side : 40, time : 20000};
                $scope.missionController.select(name,param);
            }
            
            // Gyro start: 
            var gyro=quatFromAxisAngle(0,0,0,0);
            //get orientation info, rolling back if gyro info not available
            function processGyro(alpha,beta,gamma)
            {   
                document.getElementById("alpha").innerHTML=alpha.toFixed(5);
                document.getElementById("beta").innerHTML=beta.toFixed(5);
                document.getElementById("gamma").innerHTML =gamma.toFixed(5);
                
                gyro=computeQuaternionFromEulers(alpha,beta,gamma);
            }
                

            var canvas = document.getElementById('myCanvas');
            var context = canvas.getContext('2d');
            context.canvas.width  = window.innerWidth;//resize canvas to whatever window dimensions are
            context.canvas.height = window.innerHeight;
            context.translate(canvas.width / 2, canvas.height / 2); //put 0,0,0 origin at center of screen instead of upper left corner



            function computeQuaternionFromEulers(alpha,beta,gamma)//Alpha around Z axis, beta around X axis and gamma around Y axis intrinsic local space in that order(each axis moves depending on how the other moves so processing order is important)
            {
                var x = degToRad(beta) ; // beta value
                var y = degToRad(gamma) ; // gamma value
                var z = degToRad(alpha) ; // alpha value

                //precompute to save on processing time
                var cX = Math.cos( x/2 );
                var cY = Math.cos( y/2 );
                var cZ = Math.cos( z/2 );
                var sX = Math.sin( x/2 );
                var sY = Math.sin( y/2 );
                var sZ = Math.sin( z/2 );

                var w = cX * cY * cZ - sX * sY * sZ;
                var x = sX * cY * cZ - cX * sY * sZ;
                var y = cX * sY * cZ + sX * cY * sZ;
                var z = cX * cY * sZ + sX * sY * cZ;

                return makeQuat(x,y,z,w);     
            }

            function quaternionMultiply(quaternionArray)// multiplies 2 or more quatoernions together (remember order is important although the code goes from first to last the way to think about the rotations is last to first)
            {   
                //var qSoFar = quaternionArray[quaternionArray.length-1];//javascript passes objects by reference so this is troublesome
                var temp = quaternionArray[0];
                var qSoFar ={x:temp.x,y:temp.y,z:temp.z,w:temp.w}; //must copy to not alter original object
                for(var i=1 ;i < quaternionArray.length ;i ++)
                {
                    var temp2=quaternionArray[i];
                    var next={x:temp2.x,y:temp2.y,z:temp2.z,w:temp2.w};
                    //ww,x,y,z
                    var w = qSoFar.w * next.w - qSoFar.x * next.x - qSoFar.y * next.y - qSoFar.z * next.z;
                    var x = qSoFar.x * next.w + qSoFar.w * next.x + qSoFar.y * next.z - qSoFar.z * next.y;
                    var y = qSoFar.y * next.w + qSoFar.w * next.y + qSoFar.z * next.x - qSoFar.x * next.z;
                    var z = qSoFar.z * next.w + qSoFar.w * next.z + qSoFar.x * next.y - qSoFar.y * next.x;
                    
                    qSoFar.x=x;
                    qSoFar.y=y;
                    qSoFar.z=z;
                    qSoFar.w=w;
                }
                
                return qSoFar;
            }

            function inverseQuaternion(q)
            {
                return makeQuat(q.x,q.y,q.z,-q.w);
            }

            function degToRad(deg)// Degree-to-Radian conversion
            {
                 return deg * Math.PI / 180; 
            }

            function makeRect(width,height,depth)//returns a 3D box like object centered around the origin. There are more than 8 points for this cube as it is being made by chaining together a strip of triangles so points are redundant at least 3x. Confusing for now (sorry) but this odd structure comes in handy later for transitioning into webgl
            {
                var newObj={};
                var hw=width/2;
                var hh=height/2;
                var hd=depth/2;
                newObj.vertices=[  [-hw,hh,hd],[hw,hh,hd],[hw,-hh,hd],//first triangle
                                  [-hw,hh,hd],[-hw,-hh,hd],[hw,-hh,hd],//2 triangles make front side
                                  [-hw,hh,-hd],[-hw,hh,hd],[-hw,-hh,-hd], //left side
                                  [-hw,hh,hd],[-hw,-hh,hd],[-hw,-hh,-hd],
                                  [hw,hh,-hd],[hw,hh,hd],[hw,-hh,-hd], //right side
                                  [hw,hh,hd],[hw,-hh,hd],[hw,-hh,-hd],
                                  [-hw,hh,-hd],[hw,hh,-hd],[hw,-hh,-hd],//back
                                  [-hw,hh,-hd],[-hw,-hh,-hd],[hw,-hh,-hd],
                                  [-hw,hh,-hd],[hw,hh,-hd],[hw,hh,hd],//top
                                  [-hw,hh,-hd],[-hw,hh,hd],[hw,hh,hd],
                                  [-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],//bottom
                                  [-hw,-hh,-hd],[-hw,-hh,hd],[hw,-hh,hd]
                ];
                
                return newObj;
            }

            var cube=makeRect(canvas.width/5,canvas.width/5,canvas.width/5);
            cube.color="purple";
            var xAxis=makeRect(440,10,10);
            xAxis.color="green";
            var yAxis=makeRect(10,440,10);
            yAxis.color="red";
            var zAxis=makeRect(10,10,440);
            zAxis.color="blue";



            function renderObj(obj,q)//renders an object as a series of triangles
            {
                var rotatedObj=rotateObject(obj,q);
                context.lineWidth = 1;
                context.strokeStyle = obj.color;
                
                function scaleByZ(val,z)
                {
                    var focalLength=900; //should probably be a global but oh well
                    var scale= focalLength/((-z)+focalLength);
                    return val*scale;
                }
                
                for(var i=0 ; i<obj.vertices.length ; i+=3)
                {
                    for (var k=0;k<3;k++)
                    {
                      var vertexFrom=rotatedObj.vertices[i+k];
                      var temp=i+k+1;
                      if(k==2) 
                          temp=i;
                          
                      var vertexTo=rotatedObj.vertices[temp];       
                      context.beginPath();
                      context.moveTo(scaleByZ(vertexFrom[0],vertexFrom[2]), ( -scaleByZ(vertexFrom[1],vertexFrom[2])));
                      context.lineTo(scaleByZ(vertexTo[0],vertexTo[2]), ( -scaleByZ(vertexTo[1],vertexTo[2])));
                      context.stroke();
                    }
                }
            }

            function rotateObject(obj,q) //object , quternion to rotate rotates obeject
            {
                var newObj={};
                newObj.vertices=[];
                
                for(var i=0 ; i<obj.vertices.length ; i++)
                {
                  newObj.vertices.push(rotatePointViaQuaternion(obj.vertices[i],q));
                }
                return newObj;
            }

            function rotatePointViaQuaternion(pointRa,q)
            {
                var tempQuot = {'x':pointRa[0], 'y':pointRa[1], 'z':pointRa[2], 'w':0 };
                var rotatedPoint=quaternionMultiply([ q , tempQuot, conjugateQuot(q)]);//inverseQuaternion(q) also works 

                return [rotatedPoint.x,rotatedPoint.y,rotatedPoint.z];
                
                function conjugateQuot(qq)
                {
                    return makeQuat(-qq.x,-qq.y,-qq.z,qq.w);//return {"x":-qq.x,"y":-qq.y,"z":-qq.z,"w": qq.w};
                }
            }
                  
                  
            ////////////user input////////////////////
            var userQuat=quatFromAxisAngle(0,0,0,0);//a quaternion to represent the users finger swipe movement - default is no rotation
            var prevTouchX = -1; // -1 is flag for no previous touch info
            var prevTouchY = -1;

            //touch
            document.addEventListener("touchStart", touchStartFunc, true);//?misspelled
            document.addEventListener("touchmove", touchmoveFunc, true);
            document.addEventListener("touchend", touchEndFunc, true);


            function touchStartFunc(e)
            {
                prevTouchY=e.touches[0].clientY;
                prevTouchX=e.touches[0].clientX;
            }

            function touchmoveFunc(e)
            {
                if( navigator.userAgent.match(/Android/i) ) //stupid android bug cancels touch move if it thinks there's a swipe happening
                {   
                  e.preventDefault();
                }
                userXYmove(e.touches[0].clientX,e.touches[0].clientY);
            }

            function touchEndFunc(e)
            {
              prevTouchX = -1;
              prevTouchY = -1;
            }

            //add minimal mouse support too
            document.addEventListener("mousedown", mouseDownFunc, true);
            document.addEventListener("mousemove", mouseMoveFunc, true);
            document.addEventListener("mouseup", mouseUpFunc, true);

            function mouseDownFunc(e)
            {
              prevTouchX = e.clientX;
              prevTouchY = e.clientY;
            }

            function mouseMoveFunc(e)
            {
                if (prevTouchX!= -1)
                    userXYmove(e.clientX,e.clientY);
            }

            function mouseUpFunc(e)
            {
              prevTouchX = -1;
              prevTouchY = -1;
            }


                
            function userXYmove(x,y)
            {

                document.getElementById("userX").innerHTML=x;
                document.getElementById("userY").innerHTML=y;
                
                if(prevTouchX != -1 ) //need valid prevTouch info to calculate swipe
                {
                  var xMovement=x-prevTouchX;
                  var yMovement=y-prevTouchY;
                  //var xMovementQuat=quatFromAxisAngle(1,0,0,y/200);//movement on y rotates x and vice versa
                  //var yMovementQuat=quatFromAxisAngle(0,1,0,x/200);//200 is there to scale the movement way down to an intuitive amount
                 //userQuot=quaternionMultiply([yMovementQuat,xMovementQuat]);//use reverse order
                 
                 
                 var xMovementQuat=quatFromAxisAngle(1,0,0,yMovement/200);//movement on y rotates x and vice versa
                 var yMovementQuat=quatFromAxisAngle(0,1,0,xMovement/200);//200 is there to scale the movement way down to an intuitive amount   
                  userQuat=quaternionMultiply([gyro,yMovementQuat,xMovementQuat,inverseQuaternion(gyro),userQuat]);//use reverse order

                }
                prevTouchY=y;
                prevTouchX=x;
            }

            function makeQuat(x,y,z,w)//simple utitlity to make quaternion object
            {
                return  {"x":x,"y":y,"z":z,"w":w};
            }

            function quatFromAxisAngle(x,y,z,angle)
            {
                var q={};
                var half_angle = angle/2;
                q.x = x * Math.sin(half_angle);
                q.y = y * Math.sin(half_angle);
                q.z = z * Math.sin(half_angle);
                q.w = Math.cos(half_angle);
                return q;
            }
                //render loop
            function renderLoop() 
            {
              requestAnimationFrame( renderLoop );//better than set interval as it pauses when browser isn't active
              //context.clearRect(0, 0, canvas.width, canvas.height);//clear screen
              context.clearRect( -canvas.width/2, -canvas.height/2, canvas.width, canvas.height);//clear screen x, y, width, height
              
              //create some fake data in case web page isn't being accessed from a mobile or gyro enabled device
              renderObj(cube,quaternionMultiply([inverseQuaternion(gyro),userQuat]));
              renderObj(xAxis,inverseQuaternion(gyro));
              renderObj(yAxis,inverseQuaternion(gyro));
              renderObj(zAxis,inverseQuaternion(gyro));
            }
            renderLoop();             
});

//extra 

let oldMainCtrl = function($scope){
        $scope.state = {auto:false , init:false , started:false};
    $scope.autoDownMode = ()=>{$scope.state.auto=!$scope.state.auto};
    //var socket = io.connect(window.location.host);
    socket.on('connect', function(data) {
        socket.emit('join', 'Hello World from client');
    });
    socket.on('motor-status',(status)=>{
            console.log('motor status recieved '+status)
            $scope.status = status ;
            $scope.$digest();
    });
    socket.on('msg-client',(msg)=>{
            console.log('Msg from drone : ',msg);
    });
    $scope.init = ()=>{
        $scope.state.init = true;
        socket.emit('init-motor', {message:'start motor'});
    }
    $scope.stop = ()=>{
        $scope.state.started= false;
        socket.emit('stop-motor', {message:'stop motor'});
    }
    $scope.sendValue = (val)=>{
        if(val==9){
            $scope.state.started= true;
        }
        socket.emit('speed-motor', {payload:val,message:'speed change'});
    }

    $scope.sendValueWithMotor = (motorNumber,val)=>{
        if(val==9){
            $scope.state.started= true;
        }
        socket.emit('speed-motor', {payload:{motorNumber : motorNumber, value : val},message:'speed change'});
    }
};


