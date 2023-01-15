
const { parseGstDeviceMonitorOutput } = require('./index.js');
const fs = require('fs');

const input = fs.readFileSync(process.argv[2], {encoding: 'utf8'});
const devices = parseGstDeviceMonitorOutput(input);

console.log(JSON.stringify(devices, true, 2));