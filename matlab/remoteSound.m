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
% Fs: Sampling frequency. default being 8192 [Hz].

	current_path = dir([mfilename('fullpath'),'.m']).folder;

	addpath(fullfile(current_path, 'server'));

	global servC;

	% Set default Fs to 8192 Hz as sound() does
	if nargin < 3
		volume = 100;
	end
	if nargin < 4
		Fs = 8192;
	end

	% Try empty as default value
	if isempty(volume)
		volume = 100;
	end
	if isempty(Fs)
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
		% Get full path
		target = toAbsPath(target);
		% Parse only file name without other path informations
		dirs = split(target, '/');
		file_name = dirs{end};

		% Copy the file to host, ignore if already exist
		if ~strcmp(dir(target).folder, fullfile(servC.directory, 'resources'))
			copyfile(target, fullfile(servC.directory, 'resources'));
		end
	end


	% Update the arxiv log file
	updateArxiv();


	%% Request remote device to download the file
	% Obtain the network information of the remote device
	device_index = strcmp(servC.devices.DeviceName, device_name);
	device_info = servC.devices(device_index, :);
	% Generate the corresponding request to ask the client download audio file
	client_uri = matlab.net.URI(sprintf('http://%s:%s/', device_info.Address, string(device_info.Port)));
	service_api = sprintf('download/%s', file_name);

	% Send the request to ask the client download targeted audio file
	res = sendHTTPRequest(client_uri, 'GET', service_api);

	% Generate a temporary time stamp for instant play
	tms_full_path = generateTimeStampFile();

	% Send ready signal for processing
	ready_res = sendHTTPRequest(servC.uri, 'POST', 'ready', tms_full_path);
	% Send play signal once ready
	play_res = sendHTTPRequest(servC.uri, 'GET', 'start');

	% ---------------- %
	% End of execution
	% ---------------- %

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

	function abs_path = toAbsPath(path_str)
		dirc = dir(path_str);
		if dirc.isdir
			abs_path = dirc.folder;
		else
			abs_path = fullfile(dirc.folder, dirc.name);
		end
	end

	function fullpath = generateTimeStampFile()
		fullpath = fullfile(servC.directory, 'resources', servC.default_tms_name);
		time_stamp = sprintf('new 0:00 %s %s %d\n', device_name, file_name, volume);
		writeFile(fullpath, time_stamp);
	end

	function updateArxiv()
		% Read from the current arxiv log
		arxiv_path = fullfile(servC.directory, 'fileArxiv.json');
		arxiv = readFile(arxiv_path);

		% add info if not exist
		if ~ismember(file_name, string(arxiv.fileNames))
			arxiv.fileNumber = arxiv.fileNumber +1;
			arxiv.fileNames{end+1} = file_name;
		end

		% write new fileArxiv
		writeFile(arxiv_path, arxiv);
	end

end % remoteSound