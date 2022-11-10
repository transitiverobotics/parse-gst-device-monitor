
const setFromPath = (obj, path, value) => {
  if (path.length == 0) return obj;
  const next = path.shift();
  if (path.length == 0) {
    obj[next] = value;
  } else {
    if (!obj[next]) obj[next] = {};
    setFromPath(obj[next], path, value);
  }
};
const set = (obj, string, value) => setFromPath(obj, string.split('.'), value);

/** parse the output from gst-device-monitor-1.0 and return as JSON object */
exports.parseGstDeviceMonitorOutput = (output) => {

  const lines = output
      .split('\n')
      .filter(x => x.length > 0)
      .map(line => line.replace(/\t/g, '    '));

  // annotate the lines with some syntactic, but still local information
  const annotatedLines = lines.map((line) => {
    const field = line.match(/^\s*(?<key>[a-z\s]*)\s*:(?<value>.*)/)?.groups;
    return {
      line,
      indentation: line.search(/\S/),
      field,
      property: !field &&
        line.match(/^\s*(?<key>[a-z0-9-_\.]*) = (?<value>.*)/)?.groups,
      type: line.match(/^\s*gst-launch-1.0 (?<type>\S*) .*!.*$/)?.groups.type
    };
  });

  // now iterate through the lines and process based on context
  const devices = [];
  let device;
  let field;
  let properties = false;

  for (let i in annotatedLines) {
    const current = annotatedLines[i];
    const previous = i > 0 && annotatedLines[i - 1];
    if (current.line == 'Device found:') {
      // start new device object
      device = {};
      devices.push(device);
      properties = false;
      field = null;
    } else if (current.type) {
      device.type = current.type;
    } else if (current.field) {
      // start new field
      field = current.field.key.trim();
      if (field == 'properties') {
        properties = true;
        device[field] = {};
      } else {
        properties = false;
        device[field] = [];
        const trimmed = current.field.value.trim();
        trimmed.length > 0 && device[field].push(trimmed);
      }
    } else if (field) {
      // continuation of previous field
      if (properties) {
        if (current.property) {
          set(device[field], current.property.key, current.property.value);
        }
      } else {
        const trimmed = current.line.trim();
        trimmed.length > 0 && device[field].push(trimmed);
      }
    }
  }

  // some post-processing of values
  devices.forEach(device => {
    device.caps = device.caps
        ?.map(cap => {
          const groups = cap.match(/^(?<type>[^,]*), (?<parameters>.*)/)?.groups;
          if (groups) {
            const parameters = parseCapParameters(groups.parameters);
            return {
              type: groups.type,
              parameters
            };
          } else {
            return undefined;
          }
        }).filter(x=>x);
  });

  return devices;
};


/** parse things link
 format=(string)YUY2, \
 width=(int)1280, \
 height=(int)960, \
 pixel-aspect-ratio=(fraction)1/1, \
 framerate=(fraction){ 15/2, 5/1 };
 */
const parseCapParameters = (params) => {
  if (!params) return {};

  const groups = params
    .match(/(?<name>[a-z\-]*)=\((?<type>[a-z]*)\)(?<rest>.*)/)?.groups;
  if (!groups) return {};

  const values = {
    valueType: groups.type
  };
  const rtv = {
    [groups.name]: values
  };

  let nextRest;
  // match from rest the value part
  if (groups.rest[0] == '{') {
    // it's a choice
    const valueMatch = groups.rest.match(/\{(?<list>[^\}]*)\}(?<rest>.*)/)?.groups;
    if (!valueMatch) {
      console.warn('parse error: choice', groups.rest);
    } else {
      values.type = 'choice';
      values.list = valueMatch.list.split(', ').map(s => s.trim());
      nextRest = valueMatch.rest;
    }

  } else if (groups.rest[0] == '[') {
    // it's a range
    const valueMatch = groups.rest
      .match(/\[ (?<min>\d*), (?<max>\d*) \](?<rest>.*)/)?.groups;
    if (!valueMatch) {
      console.warn('parse error: range', groups.rest);
    } else {
      values.type = 'range';
      values.min = valueMatch.min;
      values.max = valueMatch.max;
      nextRest = valueMatch.rest;
    }

  } else {
    // regular value
    const valueMatch = groups.rest.match(/(?<value>[^, ;]*)(?<rest>.*)/)?.groups;
    if (!valueMatch) {
      console.warn('parse error: atom', groups.rest);
    } else {
      values.type = 'atom';
      values.value = valueMatch.value;
      nextRest = valueMatch.rest;
    }
  }

  const sub = parseCapParameters(nextRest);
  Object.assign(rtv, sub);

  return rtv;
};
