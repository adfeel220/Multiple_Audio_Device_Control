function clearFiles()

	addpath('./server');

	global servC;

	files = dir(fullfile(servC.directory, 'resources'));

	for f = 1:length(files)
		% ignore directories and hidden files
		if files(f).isdir || files(f).name(1) == '.'
			continue;
		end
		% Delete file
		fullpath = fullfile(files(f).folder, files(f).name);
		if exist(fullpath, 'file') == 2
			delete(fullpath);
		end
	end

	% Update 'fileArxiv.json' to empty
	fileArxiv_data.fileNumber = 0;
	fileArxiv_data.fileNames = [];

	writeFile(fullfile(servC.directory, 'fileArxiv.json'), fileArxiv_data);

	% 
	if isServerOn()
		resp = sendHTTPRequest(servC.uri, 'GET', 'sync');
		if resp.StatusCode == matlab.net.http.StatusCode.OK
			fprintf('(%s) Simutaneously delete files on connected remote devices\n', resp.StatusLine);
		end
	end

end % function clearFiles