
const { parseGstDeviceMonitorOutput } = require('./index.js');
const fs = require('fs');
const assert = require('assert');

const DIR = 'test_cases';

describe('gstUtils', () => {

  fs.readdirSync(DIR).forEach(filename => {
    if (filename.endsWith('.txt')) {
      test(filename, () => {
        const input = fs.readFileSync(`${DIR}/${filename}`, {encoding: 'utf8'});
        const output = fs.readFileSync(`${DIR}/${filename}.json`, {encoding: 'utf8'});
        const correct = JSON.parse(output);

        const devices = parseGstDeviceMonitorOutput(input);
        // to get output, for creating new test cases
        fs.writeFileSync(`/tmp/_gst_parsed_${filename}`,
          JSON.stringify(devices, true, 2));
        assert.deepStrictEqual(devices, correct);
      });
    }
  });

  // test('ubuntu 20', () => {
  //   const input = fs.readFileSync('testInput.txt', {encoding: 'utf8'});
  //   const output = fs.readFileSync('testOutput.json', {encoding: 'utf8'});
  //   const correct = JSON.parse(output);

  //   const devices = parseGstDeviceMonitorOutput(input);
  //   assert.deepStrictEqual(devices, correct);
  // });

  // test('ubuntu 22', () => {
  //   const input = fs.readFileSync('u22lumin1.txt', {encoding: 'utf8'});
  //   const output = fs.readFileSync('u22lumin1.correct.json', {encoding: 'utf8'});
  //   const correct = JSON.parse(output);

  //   const devices = parseGstDeviceMonitorOutput(input);
  //   fs.writeFileSync('/tmp/newOutput.json', JSON.stringify(devices));
  //   assert.deepStrictEqual(devices, correct);
  // });
});