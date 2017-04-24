#include <node.h>
#include <iostream>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "GPIOClass.h"

namespace demo {

using namespace std;

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    string inputstate = "-1";
    GPIOClass* readPin = new GPIOClass("20"); //create new GPIO object to be attached to  GPIO4
    readPin->export_gpio(); //export GPIO
    readPin->setdir_gpio("in"); //GPIO set to output      
    readPin->getval_gpio(inputstate); //read state of GPIO input pin

    char tab2[1024];
    strcpy(tab2, inputstate.c_str());
    
    args.GetReturnValue().Set(String::NewFromUtf8(isolate, tab2));
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "getReading", Method);
}

NODE_MODULE(addon, init)

}  // na

