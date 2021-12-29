import fs from 'fs';
import { __dirname, ConnectionStatus} from '../app.js';
import axios from 'axios';

/*
 * A client module to allow web host to send requests to the remote devices
 */
class client {

    constructor() {
        this.devices = {};
        this.files = {};
    }

    refresh() {
        this.devices = JSON.parse(fs.readFileSync(__dirname + '/remote.json'));
        this.files = JSON.parse(fs.readFileSync(__dirname + '/fileArxiv.json'));
    }

    // Checking the connection status of remote devices
    // Via the web command.
    async checkStatus() {
        let status = [];
        let promises = [];
        for (let i = 0; i< this.devices.num; i++){
            status.push(ConnectionStatus.unknown);
        }

        for (let i = 0; i < this.devices.num; i++)
        {
            let addr = "http://" + this.devices.ips[i] + ":" + this.devices.ports[i].toString();
            promises.push(
                // 'await' is important!!! Need to wait for processes finish before fulfilling all promises.
                // Otherwise it doesn't work.
                await axios({
                    method: 'get',
                    url: addr,
                    timeout: 1000
                })
                .then(response => {
                    if(response.status == 200)
                    {
                        status[i] = ConnectionStatus.fine;
                    }
                    else{
                        status[i] = ConnectionStatus.other;
                    }
                    
                }).catch(err => {
                    status[i] = ConnectionStatus.disconnected;
                })
            )
        }
        Promise.all(promises);

        return status;
    }

    // Request to delete file from the remote devices
    async deleteFile(fname) {
        let promises = [];

        for (let i = 0; i < this.devices.num; i++) {
            let addr = "http://" + this.devices.ips[i] + ":" + this.devices.ports[i].toString() + "/deleteFile";
            promises.push(
                axios({
                    method: 'post',
                    url: addr,
                    data: {
                        filename: fname
                    }
                }).then(response => {
                    console.log('Request remote %s to delete file \'%s\'', this.devices.names[i], fname);
                }).catch(err => {
                    console.log('Fail to request delete for \'%s\'', this.devices.names[i])
                })
            )
        }
        Promise.all(promises);
    }

    // Update the current host address (control computer) to the remote devices
    async syncAddrFile() {
        this.files = JSON.parse(fs.readFileSync(__dirname + '/fileArxiv.json'));
        
        let promises = [];

        for (let i = 0; i < this.devices.num; i++) {
            let addr = "http://" + this.devices.ips[i] + ":" + this.devices.ports[i].toString() + "/sync";
            promises.push(
                axios({
                    method: 'post',
                    url: addr,
                    data: {
                        address: process.env.IP,
                        port: process.env.PORT,
                        files: this.files
                    }
                }).then(response => {
                    console.log('Sending host address to \'%s\'', this.devices.names[i]);
                }).catch(err => {
                    console.log('Fail to send address to \'%s\', error:\n%s', this.devices.names[i], err);
                })
            )
        }
        Promise.all(promises);
    }


    // Request all remote devices to download all the files stored in the server
    async requestDownload_all() {
        this.files = JSON.parse(fs.readFileSync(__dirname + '/fileArxiv.json'));

        for (let i = 0; i < this.files.fileNumber; i++) {
            this.requestDownload(this.files.fileNames[i]);
        }
    }

    // Request all remote devices to download file specified by 'filename'.
    async requestDownload(fname) {
        
        let promises = [];

        for (let i = 0; i < this.devices.num; i++) {
            console.log('Request remote %s to download file \'%s\'', this.devices.names[i], fname);

            let addr = "http://" + this.devices.ips[i] + ":" + this.devices.ports[i].toString() + "/download";

            promises.push(
                axios({
                    method: 'post',
                    url: addr,
                    data: {
                        filename: fname
                    }
                }).then(response => {
                    console.log('Receiving response: %s', response)
                }).catch(err => {
                    console.log('Fail to request download for \'%s\', getting error:\n%s', this.devices.names[i], err)
                })
            )
        }
        Promise.all(promises);
    }


    async sendTimestamp(fullEvents, startTime) {
        let agentEvents = [];   // going to be a 2d array, first coordinate is the device; the second stores the events

        // Initialize each coordinate (represting devices) with an empty array
        for (let i = 0; i < this.devices.num; i++) {
            agentEvents.push([]);
        }
        
        // assign the events according to their respective devices
        fullEvents.forEach(event => {
            let deviceIndex = this.devices.names.indexOf(event.deviceName);

            agentEvents[deviceIndex].push(event);
        });


        // Send the event data to remote devices
        let promises = [];
        let isReady  = [];

        for (let i = 0; i < this.devices.num; i++) {
            console.log('Sending time stamps to remote device \'%s\' @%s', this.devices.names[i], this.devices.ips[i]);

            let addr = "http://" + this.devices.ips[i] + ":" + this.devices.ports[i].toString() + "/timeStamp";

            promises.push(
                axios({
                    method: 'post',
                    url: addr,
                    data: {
                        startTime: startTime,
                        events: JSON.stringify(agentEvents[i])
                    }
                }).then(response => {
                    console.log('Receiving response: \'%d\' from %s', response.status, this.devices.names[i]);
                    
                    // Store the ready information as true/false
                    isReady.push(response.status == 200);

                }).catch(err => {
                    console.log('Fail to send time stamp for \'%s\', getting error:\n%s', this.devices.names[i], err)
                })
            )
        }
        Promise.all(promises);

        return isReady;
    }


    // Request the remote devices to start playing audios
    async startPlaying() {
        let promises = [];

        for (let i = 0; i < this.devices.num; i++) {
            console.log('Request remote %s to stat playing.', this.devices.names[i]);

            let addr = "http://" + this.devices.ips[i] + ":" + this.devices.ports[i].toString() + "/play";

            promises.push(
                axios({
                    method: 'get',
                    url: addr
                }).then(response => {
                    console.log('Receiving response: %s', response)
                }).catch(err => {
                    console.log('Fail to request playing for \'%s\', getting error:\n%s', this.devices.names[i], err)
                })
            )
        }
        Promise.all(promises);
    }

}


export default client