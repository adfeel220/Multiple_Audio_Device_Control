function writeFile(filename, variable)
	%
	fid = fopen(filename, 'w');

	% Get file extension to determine operations
	ext = split(filename, '.');
	ext = ext{end};
	% convert variable to json format to store
	if strcmp(ext, 'json')
		variable = jsonencode(variable);
	end
	fprintf(fid, variable);

	fclose(fid);
end