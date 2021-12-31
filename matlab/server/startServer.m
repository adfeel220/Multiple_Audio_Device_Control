function is_running = startServer(directory, address, port, hostName)

   global servC;

   argv = '';

   if nargin == 0
      directory = servC.directory;
   end
   if nargin > 1
      argv = [argv, sprintf('-i %s ', address)];
      servC.address = address;
   end
   if nargin > 2
      argv = [argv, sprintf('-p %s ', port)];
      servC.port = port;
   end
   if nargin > 3
      argv = [argv, sprintf('-n %s ', hostName)];
      servC.name = hostName;
   end

   system(sprintf('npm start --prefix %s -- %s &', directory, argv));

   % Check status
   is_running = isServerRunning(false);
   if is_running
      return;
   end

   %% Retry while trying to solve common problems automatically
   % path include problem
   addPath('/usr/local/bin/');
   % Port already occupy problem
   freePort();

   % try to restart
   system(sprintf('npm start --prefix %s -- %s &', directory, argv));

   is_running = isServerRunning(true);


   % Subfunction to check if the server is already running
   function is_run = isServerRunning(try_solve)
      [is_run, pid] = isServerOn();
      % No such process found on port
      if ~is_run
         if try_solve
            fprintf('Not able to start server on port %s. Possibly due to\n1) Directory error. Please check if the directory is correct.\n2) Include PATH error. Try to include the path of npm using following command ''which npm'' in your normal terminal and paste the output as NPM_PATH and call\naddPath(''NPM_PATH'')\nIn Matlab.\n', servC.port);
         else
            fprintf('Not able to start server on port %s. Automatically retry...\n', servC.port);
         end
      else
         fprintf('Server started successfully on port %s with PID %s\n', servC.port, pid);
      end
   end


end % function startServer