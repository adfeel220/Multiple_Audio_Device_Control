import fs from 'fs';
import { __dirname } from '../app.js';
import { timeStr2sec } from '../util/utility.js';
import { PythonShell } from 'python-shell';
import path from 'path';

/* 
    A audio playing controller module for usage from the web UI
*/
class audioPlayer {
    
    constructor(events) {
        this.urlDir = '';
        this.fileList = {};

        this.startTime = '';

        this.audioPlaybacks = [];
        this.events = events;

        // Record in second
        this.timeStamp = [];

        // Open a python object
        this.pyInterface = new PythonShell('play.py', { scriptPath: path.join(__dirname, 'audio')});     

        // listen on message sent back from the python program
        this.pyInterface.on('message', message => {
            console.log('Py: ' + message);
        })

    }

    init(startTimeStr) {
        console.log('===== Start Initialization for Audio Player =====');

        // The directory expressed as URL
        this.urlDir = __dirname + '/resources/';

        // The json file stored in 'fileArxiv.json'
        this.fileList = JSON.parse(fs.readFileSync(__dirname + '/fileArxiv.json'));

        this.loadAudioFile();
        this.readTimeStamp();

        this.startTime = startTimeStr;

        console.log('=================================================');
    }

    // Load all files specified in 'fileArxiv.json'
    loadAudioFile() {
        console.log('--- Loading audio files ---');

        // Update the directory of audio files (passing the absolute directory to python program)
        this.pyInterface.send('DIR ' + this.urlDir);
        // Command python program to load events
        this.pyInterface.send('LOAD-events ' + JSON.stringify(this.events));

        console.log('---------------------------');
    }

    // Import time stamp as a array of strings
    // the format is ['0:10', '0:20', ...]
    // Convert the time stamps into numbers measured in seconds
    readTimeStamp() {
        console.log('---- Reading Time Stamp ----');

        // initialize the container
        this.timeStamp = [];
        
        // Parse each time stamp into numbers
        this.events.forEach(element => {
            this.timeStamp.push(timeStr2sec(element.startTime));
        });

        console.log('----------------------------');
    }


    // Play the audio with pre-arranged event chain given a start time
    play() {

        // Convert the measure of time stamps into intervals
        let timeIntervals = [];
        let previous = this.startTime;

        // Get effective time stamp, i.e. the time stamps after the start time
        let effTimeStamp = this.timeStamp.filter(element => element >= this.startTime);      // effTimeStamp is all time stamps >= this.startTime
        let startingEventIndex = this.events.findIndex(element => timeStr2sec(element.startTime) >= this.startTime );

        // Decide the time intervals
        // So that 'effTimeStamp' consists of a list of timestamps that are later than the starting time
        effTimeStamp.forEach(current => {
            // time Intervals contains the waiting time between each event
            timeIntervals.push(current - previous);
            previous = current;
        })
        
        // Since the data is prepared, send the command to python program to execute it
        this.pyInterface.send('PLAY ' + startingEventIndex + ' ' + JSON.stringify(timeIntervals));

        // Prepare the case of terminating the python program
        this.pyInterface.end(function (err, code, signal) {
            console.log('    The error: ' + err);
            console.log('    The exit code was: ' + code);
            console.log('    The exit signal was: ' + signal);
                
            console.log('*** Python shell closed.');
        })

    }

    
}

export default audioPlayer;