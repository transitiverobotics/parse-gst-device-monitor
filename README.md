# parse-gst-device-monitor

Parse the output from gst-device-monitor-1.0 and return as JSON object. No dependencies.

## Sample usage

```js
const { parseGstDeviceMonitorOutput } = require('parse-gst-device-monitor');
const { execSync } = require('child_process');

const input = execSync('gst-device-monitor-1.0', {encoding: 'utf8'});
const devices = parseGstDeviceMonitorOutput(input);
```

See [testOutput.json](/testOutput.json) for an example of the output format.