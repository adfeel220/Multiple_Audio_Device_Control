function servC = serviceConfig()
% Generate the global configuration settings

addpath('./server');
global servC;

% Assign default value
servC.port = '8080';
servC.default_audio_name = 'INSTANT.wav';
servC.default_tms_name = 'INSTANT.txt';

servC.directory = dir('../host').folder;


% Try to read servser status from server log file
is_read = readStatus();

if is_read
	servC.uri = matlab.net.URI(sprintf('http://%s:%s/', servC.address, servC.port));
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