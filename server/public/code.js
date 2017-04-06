let app = angular.module('rutvik',['ngRoute']);
app.config(function($routeProvider) {
  $routeProvider
    .when("/gyro", {
      templateUrl: 'pages/gyro.html',
      controller: 'gyroCtrl'
    })
    .when("/", {
      templateUrl: 'pages/main.html',
      controller: 'main'
    })
    
    ;
   
});
app.controller('main',function($scope){
    $scope.status = 'Not Connected';
    $scope.state = {auto:false , init:false , started:false};
    $scope.autoDownMode = ()=>{$scope.state.auto=!$scope.state.auto};
    var socket = io.connect(window.location.host);
    socket.on('connect', function(data) {
        socket.emit('join', 'Hello World from client');
    });
    socket.on('motor-status',(status)=>{
            console.log('motor status recieved '+status)
            $scope.status = status ;
            $scope.$digest();
    });
    socket.on('msg-client',(msg)=>{
           console.log(msg);
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

    

})  

app.controller('gyroCtrl',function($scope){
    console.log('gyroCtrl loaded')
    $scope.curr = {x:98,y:10,z :12};
});

