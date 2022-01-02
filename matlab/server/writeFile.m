function writeFile(filename, variable)
% Write the variable to file. Auto convert to JSON format (struct in Matlab) if is JSON.

	fid = fopen(filename, 'w');

	% Get file extension to determine operations
	ext = split(filename, '.');
	ext = ext{end};
	% convert variable to json format to store
	if strcmp(ext, 'json')
		variable = jsonencode(variable);
	end

	% write content
	fprintf(fid, variable);

	fclose(fid);
end