let app = angular.module('rutvik',['ngRoute','ngMaterial']);
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
    .when("/indepentControl", {
        templateUrl: 'pages/motor_control.html',
        controller: 'MotorControlCtrl'
    })    
    ;
});

app.controller('main',function($scope){
    $scope.status = 'Not Connected';
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

    $scope.sendValueWithMotor = (motorNumber,val)=>{
        if(val==9){
            $scope.state.started= true;
        }
        socket.emit('speed-motor', {payload:{motorNumber : motorNumber, value : val},message:'speed change'});
    }
    

})  

app.controller('gyroCtrl',function($scope){
    console.log('gyroCtrl loaded')
    $scope.curr = {x:98,y:10,z :12};
});

app.directive("mdNumPicker", function(){
return {
          restrict: 'EC',
          controller: 'MotorControlCtrl',
          scope: {
            val: '=ngModel',
            maxValue: '=*?',
            minValue: '=*?',
            onChange: '&',
            name : '@'        
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
var socket = io.connect(window.location.host);
app.controller('MotorControlCtrl',function($scope){
    console.log('Motor Controller Loaded');

            $scope.sendValue = (motorNumber,val)=>{
                console.log({value : val});
                socket.emit('speed-motor', {payload:{motorNumber : motorNumber, value : val},message:'speed change'});
            }    


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
                $scope.val++;
                $scope.sendValue($scope.name,$scope.val);
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
                $scope.val--;
                $scope.sendValue($scope.name,$scope.val);
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
            })
            

});

