import { Router } from 'express';
import { __dirname } from '../app.js';
import fs from 'fs'
import path from 'path';
import axios from 'axios'
import audioPlayer from '../audio/audioPlayer.js';

let router = Router();

let player = null;

const filePath = './resources/';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Audio control panel' });
});


// To download files from remote server
// Called when synchronization
router.post('/download', (req, res, next) => {

  // Obtain the remote host address
  let addr = JSON.parse(fs.readFileSync('./controller.json', 'utf-8'));

  // Obtain the file name to download
  let filename = req.body.filename;

  console.log('----- Download File -----');
  
  // Create the url of request
  let url = 'http://' + addr.address + ':' + addr.port + '/download/' + req.body.filename;

  // Create the promise to access web services
  axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  }).then( response => {
    console.log('Receive response (%d) from server when downloading %s', response.status, req.body.filename);

    // Using pipe streams to download, otherwise the file contents may be damaged
    response.data.pipe(fs.createWriteStream(filePath + filename));
    
  }).catch( err => {
    console.log('Catching error when downloading %s\n%s', req.body.filename, err);
  }).finally( () => {
    console.log('-------------------------');
  })
  
  // Update local fileArxiv //
  // Open the file as JSON object
  let fileList = JSON.parse(fs.readFileSync(__dirname + '/fileArxiv.json', 'utf-8'));
  
  // Get the index stored in the list,
  //   will return -1 if such filename doesn't exist
  let fileIndex = fileList.fileNames.indexOf(filename);
  
  // Case 1: If the filename already exist
  //     ==> Overwrite the file
  //     (don't need to do anything because we already did it.)
  
  // Case 2: If the file doesn't exist
  //     ==> Add new file
  if (fileIndex == -1)
  {
    fileList.fileNumber += 1;
    fileList.fileNames.push(filename);
  }

  // Update the json file
  fs.writeFileSync(__dirname + '/fileArxiv.json', JSON.stringify(fileList));
  
});


// Synchronize the host address and the file list
router.post('/sync', (req, res, next) => {

  // ** Address **
  
  let newAddr = {
    address: req.body.address,
    port: req.body.port,
  }

  // Save the updated status to fileArxiv.json
  fs.writeFileSync('./controller.json', JSON.stringify(newAddr));

  console.log('Update the host address to %s:%s', newAddr.address, newAddr.port);

  //  ** file list **
  let fileList = req.body.files;

  // Check if file is not in the list, delete
  // Go through all the files in the 'resources' directory
  fs.readdir(path.join(__dirname, '/resources'), (err, files) => {
    if (err) {
      console.log('Getting error when reading directory \'resources\':\n' + err)
    }

    // Check each file inside the 'resources' directory
    files.forEach(file => {
      // Check if the file in the directory does not exist in the list
      if (fileList.fileNames.indexOf(file) == -1) {
        // delete it
        fs.unlink(path.join(__dirname, '/resources', file), err => {
          if (err) {
            console.log('Error when trying to delete file no existed in list: ' + file);
          }
          else {
            console.log('Successfully delete ' + file);
          }
        })
      }
    })
  })

  // Update the fileArxiv file to maintain file management
  fs.writeFileSync(__dirname + '/fileArxiv.json', JSON.stringify(fileList));
});



// Delete file from the remote device
router.post('/deleteFile', (req, res, next) => {
  console.log('-- delete File --');

  // Delete from the local directory
  fs.unlink(filePath + req.body.filename, err => {
    if (err)
    {
      console.log('Error:\n' + err);
    }
    else
    {
      console.log(' - \'' + req.body.filename + '\' has been deleted successfully.')
    }
  });

  // Update the file list
  let fileListDir = __dirname + '/fileArxiv.json';

  // Read in the json file
  let fileList = JSON.parse(fs.readFileSync(fileListDir, 'utf-8'));
  
  // Update the current file status
  let rmIndex = fileList.fileNames.indexOf(req.body.filename);
  // Check if the file exists
  // rmIndex == -1 means the name doesn't exist in the list
  if (rmIndex > -1)
  {
    // file exists
    // delete the record stored in 'fileArxiv.json'
    fileList.fileNumber -= 1;
    fileList.fileNames.splice(rmIndex, 1);
  }
  
  // Save the updated status to fileArxiv.json
  fs.writeFileSync(fileListDir, JSON.stringify(fileList));

  console.log('-----------------');
})


// Processing the time stamp and prepare the audio files
// Called after the user pressed "ready"
router.post('/timeStamp', (req, res) => {
  let startTime = req.body.startTime;
  let events = JSON.parse(req.body.events);

  // Init a new audio play object
  player = new audioPlayer(events);
  player.init(startTime);

  // Send ready signal to central server
  res.send({ready: true});

});


// After the devices are ready, start playing
router.get('/play', (req, res) => {
  // Command the audio player module to start playing
  player.play();
})


export default router;
