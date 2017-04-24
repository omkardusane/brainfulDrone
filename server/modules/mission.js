var mission = {
    options : {
        types :{
            FREE: {   
                name : 'FREE' , value : 1 , attr : [] ,
                build :(val1,val2)=>{
                    return {type:1};
                } 
            },
            CIRCLE:{ 
                name : 'CIRCLE' , value : 2 , attr : ['radius','time'] , 
                build :(radiusVal ,timeVal)=>{
                    return { 
                        type : 2 , 
                        name : 'CIRCLE',
                        attr :{ 
                            radius : radiusVal,
                            time : timeVal
                        }
                    };
                }
            },
            SQUARE:{ 
                name : 'SQUARE' , value : 3 , attr : ['side','time'] ,
                build :(sideVal ,timeVal)=>{
                    return { 
                        type : 3 , 
                        name : 'SQUARE',
                        attr :{ 
                            side : sideVal,
                            time : timeVal
                        }
                    };
                } 
            }
        }, 
        states : ['IDLE','READY','STARTED','FAILED','COMPLETED'],
    },
    initMissionModule: ()=>{
        mission.current = {type:1};
    },
    selectMission : (typeString,params) =>{
        //builder(mission.current,mission.options.types[typeString].build);
        // (reference,builder)=>{
        //             reference = builder(params[0],params[1]);
        //             console.log(reference);
        //         }
        mission.progress= 0 ;
        mission.current = mission.options.types[typeString].build(Number(params[0]),Number(params[1]));
        mission.state = mission.options.states[1] ;  
    },
    isReady : ()=>{
        return (mission.state == mission.options.states[1]) ;
    },
    isStarted : ()=>{
        return (mission.state == mission.options.states[2]) ;    
    },
    currentMission : ()=>{ 
        return mission.current ;
    },
    progress :(p)=>{
        mission.progress = p ;
    },
    startMission : (perform,next)=>{
        if( mission.state == mission.options.states[1] )
        {
            mission.state = mission.options.states[2];  
            if(next)next(true);
            if(perform)perform();            
        }else{
            if(next)next(false);
        } 
    },
    abort : (perform,next)=>{
        if( mission.state == mission.options.states[2] )
        {
            mission.state  = mission.options.states[3];
            if(perform)perform();
            if(next)next(true);
        }else{
            if(next)next(false);
        }
    },
    complete : (next)=>{
        if( mission.state == mission.options.states[2] )
        {
            mission.state  = mission.options.states[4];
            if(next)next();
        }
    },
    progress : 0 ,
    state : 'IDLE',
};
module.exports = mission ;

