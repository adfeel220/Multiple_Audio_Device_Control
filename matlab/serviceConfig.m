function servC = serviceConfig()
% Generate the global configuration settings

current_path = dir([mfilename('fullpath'),'.m']).folder;

addpath(fullfile(current_path, 'server'));

global servC;

% Assign default value
servC.port = '8080';
servC.default_audio_name = 'INSTANT.wav';
servC.default_tms_name = 'INSTANT.txt';

% Default waiting time for system start, set to higher value for better time synchronization
% unit in ms, do not exceed 3000 (5 seconds)
servC.default_wait_time = 0;

if ~isfield(servC, 'directory')
	servC.directory = dir(fullfile(current_path, '../host')).folder;
end

% Try to read server status from server log file
is_read = readStatus();

if is_read
	servC.uri = matlab.net.URI(sprintf('http://%s:%s/', servC.address, servC.port));
else
	error('The directory for host ''%s'' is incorrect.\n', servC.directory);
end


function is_read = readStatus()
	fname = fullfile(servC.directory, 'onService.json');
	if ~isfile(fname)
		is_read = false;
		return;
	end
	
	status = readFile(fname);

	% Assign the parsed message
	servC.name = status.name;
	servC.address = status.address;
	servC.port = status.port;

	is_read = true;
end

end % function serviceConfig()