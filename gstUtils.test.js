
const { parseGstDeviceMonitorOutput } = require('./index.js');
const fs = require('fs');
const assert = require('assert');

describe('gstUtils', () => {

  const input = fs.readFileSync('testInput.txt', {encoding: 'utf8'});
  const output = fs.readFileSync('testOutput.json', {encoding: 'utf8'});
  const correct = JSON.parse(output);

  test('see output', () => {
    const devices = parseGstDeviceMonitorOutput(input);
    assert.deepStrictEqual(devices, correct);
  });
});