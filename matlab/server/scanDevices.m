function devices = scanDevices()
	% Return a table of devices with all available devices

	global servC;

	% Request from existing service to scan available devices
	response = sendHTTPRequest(servC.uri, 'get', 'autoScanDevice');
	data = response.Body.Data;

	DeviceName = convertCharsToStrings(data.names);
	Address = convertCharsToStrings(data.ips);
	Port = data.ports;

	devices = table(DeviceName, Address, Port);
end