import { networkInterfaces } from 'os';
import find from 'local-devices'
import fs from 'fs'
import path from 'path';
import axios from 'axios';
import {__dirname} from '../app.js'


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


async function initRemoteDevices(){
    const defaultPort = 8085
    let remoteDevices = {
        "num": 0,
        "names": [],
        "ips": [],
        "ports": []
    }
    let promises = []
    let devices = await find();

    for (let i = 0; i < devices.length; i++){
        let dev = devices[i]
        let url = 'http://' + dev.ip + ':' + defaultPort + '/resp/' + process.env.PORT;
        promises.push(
            axios({
                method: 'get',
                url: url,
                timeout: 3000
            }).then(response => {
                console.log('Receive response (%d) from client device \"%s\" AKA \"%s\"', response.status, dev.ip, response.data);

                remoteDevices.num++;
                remoteDevices.names.push(response.data)
                remoteDevices.ips.push(dev.ip)
                remoteDevices.ports.push(defaultPort)

            }).catch(err => {

            })
        )
    }

    await Promise.all(promises);
    fs.writeFileSync(path.join(__dirname, 'remote.json'), JSON.stringify(remoteDevices));
    return remoteDevices;

}


function saveServerStatus(){
    let serverStatus = {
        "name": process.env.deviceName,
        "address": process.env.IP,
        "port": process.env.PORT
    };
    fs.writeFileSync(path.join(__dirname, 'onService.json'), JSON.stringify(serverStatus));
}


export { timeStr2sec, getIPAddress, initRemoteDevices, saveServerStatus }