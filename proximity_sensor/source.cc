#include <node.h>
#include <pigpio.h>

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  gpioInitialise();
  gpioSetMode(20, PI_INPUT);
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, ""+gpioRead(20)));
  gpioTerminate();
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "getReading", Method);
}

NODE_MODULE(addon, init)

}  // na
