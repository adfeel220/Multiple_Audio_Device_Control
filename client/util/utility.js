import { networkInterfaces } from 'os';


// Convert time string as '{min}:{sec}' into number measured in second
function timeStr2sec(timeStr) {
    // Assign 0 if the string is empty
    if (!timeStr.trim()) {
        return 0;
    }

    let min_sec = timeStr.split(':');   // min_sec = ['{minute}', '{second}']
    let second = Number(min_sec[0]) * 60 + Number(min_sec[1]);

    return second;
}


function getIPAddress() {

    var interfaces = networkInterfaces();
    // First check if en0 or eth0 exists
    if (interfaces.hasOwnProperty('en0')) {
        for (let i = 0; i < interfaces.en0.length; i++){
            let alias = interfaces.en0[i]
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    }
    else if (interfaces.hasOwnProperty('eth0')) {
        for (let i = 0; i < interfaces.eth0.length; i++){
            let alias = interfaces.eth0[i]
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    } 
    // If en0 and eth0 both non existent, choose another available
    else {
        for (let devName in interfaces) {
            let iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                let alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address;
          }
        }
    }

    return '0.0.0.0';
  }

export { timeStr2sec, getIPAddress }