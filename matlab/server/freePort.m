function status = freePort(port)
% Kill the process occupy the port. Kill default port 8080 if it's not assigned
% Status = 0 means successfully kill

   global servC;

   if nargin < 2
      port = servC.port;
   end

   % Killing command depends on operating systems
   if ismac || isunix
      [status, cmdout] = system(sprintf('kill -9 $(lsof -ti:%s)', port), '-echo');
   elseif ispc
      [status, cmdout] = system(sprintf('netstat -ano | findstr :%s', port));
      cmdout = split(cmdout);
      pid = cmdout(end);
      status = system(sprintf('taskkill /PID %s /F', pid), '-echo');
   end

end % 