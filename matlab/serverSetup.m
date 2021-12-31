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

% Initialisation
addpath('./server');
% if no directory assigned, assign default from parent
if nargin == 0
	host_dir = dir('../host').folder;
end


% initialize global configurations
global servC;
if ~isempty(servC)
	serviceConfig();
end
servC.directory = host_dir;


% Search for a server
if isServerOn()
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

% Initialize the initial state of all connected devices
if isServerOn()
	resp = sendHTTPRequest(servC.uri, 'GET', '/sync');
end


% update the current server status
function updateStatus()
	fname = fullfile(servC.directory, 'onService.json');
	fid = fopen(fname);
	raw = fread(fid,inf);
	str = char(raw');
	fclose(fid);
	status = jsondecode(str);
	% Assign the parsed message
	servC.name = status.name;
	servC.address = status.address;
	servC.port = status.port;
end % function updateStatus



end % function serverSetup