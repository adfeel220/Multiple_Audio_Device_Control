function timeStampStart(time_stamp_path, audio_files)
% Start playing by a time stamp file

% Params
% ---------
% time_stamp_path: (string) the path which stores the time stamp file
% audio_files: (array of strings) the paths which stores the audio files involved in this event

	global servC;

	%% Update all the audio files
	fprintf('Processing audio files...\n');
	% Read from the current arxiv log
	arxiv_path = fullfile(servC.directory, 'fileArxiv.json');
	arxiv = readFile(arxiv_path);
	% Upload all the audio files into our directory
	for file_index = 1:length(audio_files)

		% Get full path
		target = toAbsPath(audio_files(file_index));
		% Parse only file name without other path informations
		dirs = split(target, '/');
		file_name = dirs{end};

		uploadFileToServer(audio_files(file_index));

		% add info if not exist
		if ~ismember(file_name, string(arxiv.fileNames))
			arxiv.fileNumber = arxiv.fileNumber +1;
			arxiv.fileNames{end+1} = file_name;
		end

	end % for: file_index

	% write new fileArxiv
	writeFile(arxiv_path, arxiv);


	%% Distribute all the files to every clients
	resp = sendHTTPRequest(servC.uri, 'GET', 'sync');

	%% Transmit the request to execute
	tms_full_path = toAbsPath(time_stamp_path);

	% Send ready signal for processing
	ready_res = sendHTTPRequest(servC.uri, 'POST', 'ready', tms_full_path);
	% Send play signal once ready
	play_res = sendHTTPRequest(servC.uri, 'GET', 'start');

	fprintf('Start playing assigned audio events.\n');




	function abs_path = toAbsPath(path_str)
		if ~isfile(path_str)
			error('No such file or directory ''%s''', path_str);
		end
		dirc = dir(path_str);
		if dirc.isdir
			abs_path = dirc.folder;
		else
			abs_path = fullfile(dirc.folder, dirc.name);
		end
	end

	function uploadFileToServer(file_path)
	% Upload any file to host server for further use
	% 
	% Params
	% -----------
	% file_path: The Path which stores the file you wish to upload. 
	%            Can be either absolute or relative path.

		server_dir = fullfile(servC.directory, 'resources');
		if ~strcmp(dir(file_path).folder, server_dir)
			copyfile(target, server_dir);
		end
		
	end % uploadFileToServer


end % timeStampStart