function devices = serverSetup(host_dir)
% Setup a server in the background to allow further control commands
%
% Params
% ----------
% host_dir: The directory to host. 
%           The program will try to find the folder from its parent directory
%           if no arguments were assigned.
%
% Returns
% ----------
% devices: a table of all connected devices with name, ip address, and port.

current_path = dir([mfilename('fullpath'),'.m']).folder;

% Initialisation
addpath(fullfile(current_path, 'server'));

% if no directory assigned, assign default from parent
if nargin == 0
	host_dir = dir(fullfile(current_path, '../host')).folder;
end


% initialize global configurations
global servC
servC.directory = host_dir;
servC = serviceConfig();


% Check if there's any already opened server
[isServerExist, pid] = isServerOn();

% Search for a server
if isServerExist
	devices = scanDevices();
	fprintf('Server found on %s:%s. %d connected devices found.', servC.address, servC.port, size(devices, 1));
% If fails, most possible it's because there's no server, open one via Matlab
else
	fprintf('Cannot access to service, try to establish a server...\n');
	% Establish a server if no available server is found
	serverRunning = startServer(host_dir);

	if ~serverRunning
		error('Cannot establish server.');
	end

	updateStatus();

	devices = scanDevices();
	fprintf('Service establish successfully on %s:%s', servC.address, servC.port);
end

[isServerExist, pid] = isServerOn();
% Initialize the initial state of all connected devices
if isServerExist
	resp = sendHTTPRequest(servC.uri, 'GET', 'sync');
end


% update the current server status
function updateStatus()
	% Read from the service log file of host server
	fname = fullfile(servC.directory, 'onService.json');
	status = readFile(fname);

	% Assign the parsed message
	servC.name = status.name;
	servC.address = status.address;
	servC.port = status.port;
end % function updateStatus



end % function serverSetup