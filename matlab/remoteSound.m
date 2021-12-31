function remoteSound(target, device, volume, Fs)
% To control a remote device to play audio.

% Params
% ----------
% target: The target audio data. It can be
%     (1) An audio signal as called in sound()
%     (2) A string to indicate the directory of an audio file
% device: The device you wish to play audio on. It can be
%     (1) A string indicates the device name
%     (2) An index indicates the device in the table of servC.devices
% volume: number between 0-100 to indicate the volume, no decimal values allowed. default being 100 [%]
% Fs: Sampling frequency. default being 8192 [Hz]

	addpath('./server');
	global servC;

	% Set default Fs to 8192 Hz as sound() does
	if nargin < 3
		volume = 100;
	end
	if nargin < 4
		Fs = 8192;
	end

	default_filepath = fullfile(servC.directory, 'resources', servC.default_audio_name);
	% Convert if needed, and check availability of the assigned device name
	device_name = getDeviceName();

	% target is a audio signal
	if isa(target, 'double')
		% save target signal as an audio file to distribute to the remote device
		audiowrite(default_filepath, target, Fs);
		file_name = servC.default_audio_name;

	% target is a string - assume to be file path
	elseif isa(target, 'char') || isa(target, 'string')
		if ~isfile(target)
			error('No such audio file ''%s''.', target);
		end
		% Parse only file name without other path informations
		dirs = split(target, '/');
		file_name = dirs{end};
	end


	%% Request remote device to download the file
	% Obtain the network information of the remote device
	device_index = strcmp(servC.devices.DeviceName, device_name);
	device_info = servC.devices(device_index, :);
	% Generate the corresponding api request
	client_uri = matlab.net.URI(sprintf('http://%s:%s/', device_info.Address, device_info.Port));
	service_api = sprintf('download/%s', file_name);

	res = sendHTTPRequest(client_uri, 'GET', service_api);
	if res.StatusCode ~= matlab.net.http.StatusCode.OK
		error('Problems encountered when sending ''%s'' to remote device ''%s''. Get status ''%s''.', file_name, device_name, res.StatusCode);
	end

	% Generate a temporary time stamp for instant play
	generateTimeStampFile();

	


	function dname = getDeviceName()
		if isa(device, 'char') || isa(device, 'string')

			if ismember(device, servC.devices.DeviceName)
				dname = device;
			else
				error('No such device named ''%s''.', device);
			end
		else
			dname = servC.devices.DeviceName(device);
		end
	end

	function generateTimeStampFile()
		fullpath = fullfile(servC.directory, 'resources', servC.default_tms_name);
		time_stamp = sprintf('new 0:00 %s %s %d\n', device_name, file_name, volume);
		writeFile(fullpath, time_stamp);
	end

end % remoteSound