function addPath(new_path)
   if ismac || isunix
      setenv('PATH', [getenv('PATH'), ':', new_path]);
   elseif ispc
      setenv('PATH', [getenv('PATH'), ';', new_path]);
   end
end