/*
   pulse.c
 
   gcc -o pulse pulse.c -lpigpio -lrt -lpthread
 
   sudo ./pulse
*/
 
#include <stdio.h>
 
#include <pigpio.h>
 
int main(int argc, char *argv[])
{
   double start;
   float a = 0.0 ;
   int f = 1;
   if (gpioInitialise() < 0)
   {
      printf( "ERROR: pigpio initialisation failed\n");
      gpioTerminate();
      return 1;
   }
 
   /* Set GPIO modes */
   //gpioSetMode(15, PI_INPUT);
   gpioSetMode(20, PI_INPUT);
 
   /* Start 1500 us servo pulses on GPIO4 */
   //gpioServo(4, 1500);
 
   /* Start 75% dutycycle PWM on GPIO17 */
   //gpioPWM(17, 192); /* 192/255 = 75% */
 
   //   start = time_time();
   
   while (f==1)
   {
      f=0;
      a = gpioRead(20);
      //printf("%f",a) ;
      //printf("\n");
      if(a>0){
        //printf(" Detected object --------------- %f \n",a) ;    
        printf("true");
      }else{
        printf("false");
      }
      // a = gpioRead(10);
      // printf("%f \n",a) ;
      // if(a>0){
      //   printf("--------------- %f \n",a) ;    
      // }  
   }
   gpioTerminate();
   return 0;
}
// build : gcc -o pulse pulse.c -lpigpio -lrt -lpthread