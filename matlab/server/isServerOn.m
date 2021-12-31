function [is_on, pid] = isServerOn()

	global servC;

	if ismac || isunix
		[status, cmdout] = system(sprintf('echo $(lsof -ti:%s)', servC.port));
	elseif ispc
		[status, cmdout] = system(sprintf('netstat -ano | findstr :%s', servC.port));
	end

	if isempty(cmdout(1:end-1))
		is_on = false;
		pid = '';
	else
		is_on = true;
		pid = cmdout(1:end-1);
	end
end