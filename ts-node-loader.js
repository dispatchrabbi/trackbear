// IMPORTANT: this MUST remain a JS file
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { setUncaughtExceptionCaptureCallback } from "node:process"

register("ts-node/esm", pathToFileURL("./"));
setUncaughtExceptionCaptureCallback(console.log);
