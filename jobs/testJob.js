#!/usr/bin/env node

// Simple job example
// Can be started standalone or via agenda scheduler

// waste some time
console.log("wasting time..");
var now = new Date().getTime();
while(new Date().getTime() < now + 5000) { }
console.log("enough time wasted!");