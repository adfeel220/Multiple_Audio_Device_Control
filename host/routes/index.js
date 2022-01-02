import { Router } from 'express';
import { __dirname, ConnectionStatus } from '../app.js';
import fs, { link } from 'fs';
import client from '../client/client-pc.js';
import parseTimestamp from '../util/timestamp.js';
import { timeStr2sec, initRemoteDevices } from '../util/utility.js';


// INIT
let router = Router();
let serClient = new client();

let pmm = '';
let linkStatus = [];
let deviceReady = [];


/**
 * Get home page for display
 */
router.post('/', function(req, res, next) {
  next();
});

router.get('/', function(req, res, next) {
  // INIT
  // obtain the current existing files collection
  let fileList = JSON.parse(fs.readFileSync(__dirname + '/fileArxiv.json'));
  
  // Obtain the list of current remote devices
  let remoteList = JSON.parse(fs.readFileSync(__dirname + '/remote.json'));

  // Initialize the link status to unknown since we haven't check yet
  if(linkStatus.length < 1)
  {
    for (let i = 0; i < remoteList.num; i++)
    {
      linkStatus.push(ConnectionStatus.unknown);
    }
  }

  // Render page
  res.render('index', 
  {
    title: 'Audio control panel', 
    promptMessage: pmm, 
    remoteFileList: fileList.fileNames,
    remote: remoteList,
    linkStatus: linkStatus,
    isReady: deviceReady
  });
  pmm = '';
});



/**
 * Command for download existing file from the server
 */
router.get('/download/:filename', function(req, res) {
  console.log('---- User Request Download File ----');

  console.log('User %s requesting %s', req._remoteAddress, req.params.filename);
  // send the file back to the client upon requesting
  res.sendFile(__dirname + '/resources/' + req.params.filename);
  console.log('Sending %s to user %s', req.params.filename, req._remoteAddress);

  console.log('------------------------------------');
})




/**
 *  post command upon receiving file to upload a file to the host directory
 * */ 
router.post('/uploadFile', function(req, res) {
  console.log('-- Start upload files --');
  
  // Download the file to local 'resources' directory of the host
  fs.writeFile(__dirname + '/resources/' + req.files.fileUpload.name, req.files.fileUpload.data, 'base64', function(err) {
    if(err)
    {
      console.log(err);
    }
    else
    {
      console.log(' - File \'' + req.files.fileUpload.name + '\' is written successfully.');
    }
  })

  // Provide the prompt message so that the user can know it's finished
  pmm = req.files.fileUpload.name + ' is uploaded to the server.';

  // Update the file list
  let fileListDir = __dirname + '/fileArxiv.json';

  // Read in the json file
  let fileList = JSON.parse(fs.readFileSync(fileListDir, 'utf-8'));
  
  // Update the current file status
  // First check if the file already exist
  if (fileList.fileNames.indexOf(req.files.fileUpload.name) <= -1)
  {
    fileList.fileNumber += 1;
    fileList.fileNames.push(req.files.fileUpload.name);
  }
  
  // Save the updated status to fileArxiv.json
  fs.writeFileSync(fileListDir, JSON.stringify(fileList));

  // Redirect the web page back to the main page, otherwise it will stop processing
  res.redirect('back');

});


/**
 * request to delete a file from both host and remote devices (if connected)
 */
router.post('/deleteFile', function(req, res) {
  console.log('-- delete File --');

  // if user chooses the dummy option, return immediately
  if(req.body.filename == "null")
  {
    console.log('Not a valid choice of deleting file.');
    pmm = 'Please select an existing file to delete!';
    res.redirect('back');
    return;
  }

  // Delete the file
  fs.unlink(__dirname + '/resources/' + req.body.filename, err => {
    if (err)
    {
      throw err;
    }
    else
    {
      console.log(' - \'' + req.body.filename + '\' has been deleted successfully.')
      // Request the remote devices to delete the file
      serClient.deleteFile(req.body.filename);
    }


  });

  // Update the file list
  let fileListDir = __dirname + '/fileArxiv.json';

  // Read in the json file
  let fileList = JSON.parse(fs.readFileSync(fileListDir, 'utf-8'));
  
  // Update the current file status
  // Find the index of the deleted file
  let rmIndex = fileList.fileNames.indexOf(req.body.filename);
  // Check if the file exists
  if (rmIndex > -1)
  {
    fileList.fileNumber -= 1;
    fileList.fileNames.splice(rmIndex, 1);
  }
  
  // Save the updated status to fileArxiv.json
  fs.writeFileSync(fileListDir, JSON.stringify(fileList));

  // Request remote device to delete the same file
  serClient.deleteFile(req.body.filename);

  // Redirect the page to the main page again
  res.redirect('back');

  // Set the prompt message
  pmm = req.body.filename + ' is deleted.';

})




/**
 * Synchronization
 * Update the address and port stored at remote devices
 */
router.get('/sync', function(req, res) {
  console.log('Synchronisation request received.');
  // Update the status of server-side client
  serClient.refresh();
  // Inform the remote devices of the current host address
  serClient.syncAddrFile();

  // request all remote devices to downlaod all files specified in fileArxiv.json
  serClient.requestDownload_all().then(response => {
    pmm = 'Synchronization complete.';
  }).finally(() => {
    
    res.redirect('back');
  });


})



/**
 * Check the availability of remote devices
 */
router.post('/checkStatus', function(req, res) {
  serClient.refresh();
  serClient.checkStatus().then(status => {
    linkStatus = status;
  }).finally( () => {
    res.redirect('back')
  });

})

/**
 * Automatically scan all devices within the same local network
 */
router.get('/autoScanDevice', (req, res, next) => {
  console.log('Auto Scan on local devices.')
  initRemoteDevices().then(remoteDevices=>{
    linkStatus = Array(remoteDevices.num).fill(ConnectionStatus.fine);
    res.send(remoteDevices);
  });
});


/**
 * Update the device info: name, address, port
 * 
 * IF
 * 1. Doesn't exist the device name nor the ip address:
 *    - Create a new device
 * 2. Device name exists but different ip or port:
 *    - Change the ip and port of the device with the same name
 * 3. Device ip exists but different name or port:
 *    - Change the name and port of the device
 * 4. Exactly the same information exists:
 *    If different port: change port
 *    If same port: delete this device
 */
router.post('/modifyDevice', function (req, res) {
  console.log('--- Modify device information ---')


  // Obtain the string upload from the user
  let inputStr = req.body.deviceInfo;

  
  // parse the content of the input string as {name}@{address}:{port}
  let newDevice = {
    name: '',
    ip: '',
    port: 3000
  };
  let temp = inputStr.split('@');   // temp = [name, address:port]
  newDevice.name = temp[0];
  
  temp = temp[1].split(':');        // temp = [address, port]
  newDevice.ip = temp[0];
  newDevice.port = Number(temp[1])
  
  
  // Import the list of remote devices
  let remoteList = JSON.parse(fs.readFileSync(__dirname + '/remote.json'));
  
  // Obtain the location of indics
  let indices = {
    nameIndex: remoteList.names.indexOf(newDevice.name),
    ipIndex: remoteList.ips.indexOf(newDevice.ip),
    portIndex: remoteList.ports.indexOf(newDevice.port)
  };
  
  // Check if any existing name matches
  if (indices.nameIndex > -1) {
    console.log('Name exist')
    // Exists device with the same name
    // Check if ip matches
    if (indices.ipIndex > -1) {
      console.log('ip exist')
      // Exists devices with the same name and ip
      // Check if port matches
      if (indices.portIndex > -1) {
        console.log('port exist ==> delete')
        // Exists devices with the same name, ip, and port
        // DELETE the device
        remoteList.num -= 1;
        remoteList.names.splice(indices.nameIndex, 1);    // remove the entry
        remoteList.ips.splice(indices.ipIndex, 1);
        remoteList.ports.splice(indices.portIndex, 1);
      }
      // name and ip match, but port is different
      // Update the port
      else {
        console.log('port not exist ==> change port')
        remoteList.ports[indices.nameIndex] = newDevice.port;  // nameIndex should == ipIndex
      }
    }
    // Name matches, but ip doesn't
    // Change the ip and port to the new one
    else {
      console.log('ip does not exist ==> change ip and port')
      remoteList.ips [indices.nameIndex] = newDevice.ip;
      remoteList.ports[indices.nameIndex] = newDevice.port;
    }
  }
  // Name doesn't match
  else {
    console.log('Name does not exist')
    // Check if any ip matches
    if (indices.ipIndex > -1) {
      console.log('ip exists ==> change name and port')
      // IP matches but name doesn't
      // Change the name and port of the device at that address
      remoteList.names[indices.ipIndex] = newDevice.name;
      remoteList.ports[indices.ipIndex] = newDevice.port;
    }
    // Both name and IP don't match with any existing devices
    // Create a new device on the list
    else {
      console.log('ip does not exist ==> new device')
      remoteList.num += 1;
      remoteList.names.push(newDevice.name);
      remoteList.ips.push(newDevice.ip);
      remoteList.ports.push(newDevice.port);
    }
  }

  fs.writeFileSync(__dirname + '/remote.json', JSON.stringify(remoteList));
  
  console.log('---------------------------------')

  res.redirect('back');
})


// Start signal for the program
router.post('/ready', (req, res) => {
  console.log('---- Ready ----');

  serClient.refresh();

  // Determine if there's a file being uploaded
  // Showing as req.files being 'null'
  if (!req.files) {
    console.log('No time stamp file being uploaded! Terminate the ready process.')
    pmm = 'No time stamp file being uploaded!'

    res.redirect('back');
    return;
  }

  // Convert the transmitted bits to strings
  let fileContent = Buffer.from(req.files.timeStampFile.data, 'ascii').toString();

  // Determine if the file content is empty,
  // If empty, show prompt message that it's empty
  // If not empty, continue parsing
  if (!fileContent.trim()) {
    console.log('Time stamp file is empty! Terminate the ready process.');

    pmm = 'Time stamp file is empty!';

    res.redirect('back');
    return;
  }

  // Get the events specified in time stamp file
  let events;
  // Try to parse the file
  try {
    events = parseTimestamp(fileContent);
  } catch (error) {
    // Show the error if there's a parsing problem
    // Most likely to be a syntax problem
    pmm = 'Catching problem when parsing [' + req.files.timeStampFile.name + '].\nProbably a syntax problem in the file.\nThe error message:\n' + error;
  }

  // Get the start time specified by the user
  let startTime = timeStr2sec(req.body.startTime);

  serClient.sendTimestamp(events, startTime).then(isReady => {
    deviceReady = isReady;
  }).finally(() => {
    res.redirect('back');
  });
  
  console.log('---------------');
});


// After ready, start the program
router.get('/start', (req, res) => {
  // Using the audioPlayer function to play
  serClient.startPlaying();

  deviceReady = [];

  res.redirect('back');
})



export default router;
