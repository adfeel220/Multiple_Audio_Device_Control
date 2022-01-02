function variable = readFile(filename)
% read the content from file. Auto convert to JSON format (struct in Matlab) if is JSON.

	fid = fopen(filename, 'r');
	variable = fread(fid,inf);

	% Get file extension to determine operations
	ext = split(filename, '.');
	ext = ext{end};
	% convert variable to json format to store
	if strcmp(ext, 'json')
		variable = char(variable');
		variable = jsondecode(variable);
	end

	fclose(fid);
end
