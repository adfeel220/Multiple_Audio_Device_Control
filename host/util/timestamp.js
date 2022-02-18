
// Input a string from the time stamp file, 
// convert the result to a array of jsons with information at each time stamp
function parseTimestamp(timestampStr) {
    let events = [];

    // seperate the lines
    let effStrs = timestampStr.split(/\r\n|\r|\n/);

    // rule out comments and empty lines
    effStrs = effStrs.filter(line => !line.startsWith('#') && line.trim());

    // Process each effective lines
    effStrs.forEach(line => {
        // Get the script based on what's written on the line
        let script = line.split(' ');

        // Determine if it's New command
        if (script[0].toLowerCase().startsWith('n')) {

            let content = {
                type: 'new',
                startTime: '0:00',
                deviceName: '',
                audioFile: '',
                volume: -1
            }


            // Syntax New {start time} {device name} {filename} {end time} {volume}
            if (script.length >= 4) {
                content.startTime  = script[1];
                content.deviceName = script[2];
                content.audioFile  = script[3];
            }
            if(script.length == 5) {
                content.volume = Number(script[4]);
                // If exceed 100%, change to 100
                if (content.volume > 100) {
                    content.volume = 100;
                }
            }

            // Push the event into the event pool
            events.push(content);
        }
        // Determine if it's volume command
        else if (script[0].toLowerCase().startsWith('v')) {
            let content = {
                type: 'volume',
                startTime: '0:00',
                deviceName: '',
                volume: -1
            }

            let script = line.split(' ');

            // Syntax: Volume {time} {device name} {volume}
            content.startTime  = script[1];
            content.deviceName = script[2];
            content.volume     = Number(script[3]);

            if (content.volume > 100) {
                content.volume = 100;
            }

            // Push the result into the event pool
            events.push(content);
        }
        // Determine if it's Light command
        else if (script[0].toLowerCase().startsWith('l')) {

            let content = {
                type: 'light',
                startTime: '0:00',
                deviceName: '',
                led_index: 0,
                color: [0,0,0]
            }


            // Syntax: Light {time} {device name} {which strip} {light index} {Red value} {Green value} {Blue value}
            content.startTime  = script[1];
            content.deviceName = script[2];
            content.strip      = Number(script[3]);
            content.led_index  = Number(script[4]);
            content.color      = [Number(script[5]), Number(script[6]), Number(script[7])];

            // Push the event into the event pool
            events.push(content);
        }
        // Default case, unrecognized command
        else {
            console.log('Unable to identify the command name %s. Ignore command \'%s\'.', script[0], line);
        }
    });
    

    return events;
}

export default parseTimestamp;