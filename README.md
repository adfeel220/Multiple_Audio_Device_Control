---
title: Manual of Multiple Audio Control System
arthor: Tsai, Chun-Tso (蔡淳佐)
---
# Introduction
This is a project aimed at remote controlling over multiple audio devices. By establishing simple Web services over the network, we can make certain devices play specific sounds at any given time and coordinate all the devices.

# How to start
First, to implement this system, make sure:
1. `NodeJS` and `npm` is installed in your device.
2. Any version of `Python3` in installed in your device.
    You also need to install `pygame` package to your device. You can simply use `pip install pygame` command to install.
3. Use the `host` version of this program on your main controller computer.
4. Use the `client` version of this program on your remote devices to control speakers. These devices can be any computers or RPI. Basically any machine which has a suitable audio driver for your audio, and can run NodeJS and Python is good.
    Additionally, host and client can exist on the same computer. i.e. you can use 1 computer serve as host and client at the same time. Just ensure your host and client use different port number.
6. Make sure all devices are connected within the same wifi domain, usually connecting to the same WIFI router should be enough. It doesn't matter if the router is connected to the Internet or not, it can be offline.


# Using the program from Web UI
Use the command `npm start` of directory `host` on the controller computer; and the same applies on directory `client` for remote audio controller devices.
__Command arguments__
- `npm start <device_name>` can automatically set up a service on the device with the assigned name `device_name`. Default port is `8080` for `host` and `8085` for `client`.
- `npm start -i <ip_address> -p <port> -n <device_name>` can assign specific address, port, and name to the service. __NOTE__ that `Auto Scan` can not find manually assigned IPs and ports.

__Attention!__
- Always check status before doing any change of file or executing everything.
- Don't do anything before checking all the participating devices are green

# Status of remote devices
The remote devices contains 3 parts:
1. Device name
2. IP address
3. Port

The color of the name indicates the connection status of the devices:
* <font color="#BABABA">Grey</font>   means status unknown.
* <font color="#00EA0B">Green</font>  means the link is fine.
* <font color="#EA0000">Red</font>    means disconnected.
* <font color="#F17800">Orange</font> means there are other internet problems. (Usually, the orange status should not appear.)

To find the current devices and their current status, you can
1. Press `Auto Scan`, the program will automatically search any available services within the same LAN on port `8085` (the default port of client services).

2. You can click the `check` button at any time to update the status.

3. After you click `ready`, you may press `check` again. If there's a `== Ready` at the end of the device, it means the device has finished all the prepartion works and ready to play.

## How to update the list of remote devices
Here's a brief explaination for you to change the device list.
You basically only enter a string in the format of **`Device name`@`IP address`:`port number`** and then press update. The functionalities depend on the following cases:
1. Neither the device name nor the IP address exist in the list.
    - Create a new device with the name and address entered.
2. The device name exists but the IP or port number is different.
    - Change the device with the same name with new IP and port number.
3. The IP already exists but the name or port number is different.
    - Change the name and port for the device with that IP.
4. Exists a device with the same name and IP, but different port.
    - Change the port to the new number.
5. Exists a device with exactly the same name, IP, and port.
    - Delete the device from the list.

## Buttons
Upload and delete buttons should be intuitive. You can also use the list in the 'Delete file' section to check the files already on the system.

Once the file modification is finished, you may press 'sync' to synchronize all the files and directories. Attention that this should be done when all the desired devices are connected.

## Ready to Start
After all the file managements are done. You may upload a timestamp file in the following syntax.

1. The time stamp file:
**Example of a time stamp file**
```
# This is a time stamp script
# Use '#' for commenting

# The event can be defined by
# 1. New audio event: create a new audio playback.
#    Syntax :-
#    N[ew] {start time} {device name} {filename} [{volume}]
#    
#    ex: 
#    n 0:15 myDevice test.mp3          => 'myDevice' will play test.mp3 at 0:15 until test.mp3 ends.
#    New 1:20 myDevice test.mp3 20     => 'myDevice' will play test.mp3 at 1:20 with volume 20%.

# 2. Adjust volume:
#    V[olume] {time} {device name} {new volume}
#    
#    ex:
#    v 2:20 myDevice2 50        => Change the volume of myDevice2 to 50% at 2:20


# Below you can define your time stamp code
# Be sure each command is seperated by lines
# 
# Please write the time stamps incrementally according the start time, otherwise some errors will occur.
```

2. The starting time:
You may also specify the starting time of your program, this is designed for debug purpose. You need to type it in the format of **{minute}:{second}**.

What this does, for example, the 2nd event in time stamp file is defined at 0:10. If you type in '0:09' at the section of starting time. The program will start at the time of 9 second. That is, your 2nd event will be played 1 second later.

**Note**: These 2 options (time stamp and starting time) need to be specified before you press 'ready'. 


## Ready and Play
It's normal to see the files or starting time disappear after you press ready. After 'ready', you may directly press 'play' to start the program. If you want to check if the programs are ready, you may press the 'check' button at the connection status section. If the devices have '== Ready' attached at the end, it means the devices are ready.



# Using the Matlab Interface
1. Execute client services on remote devices, simply with command `npm start` or `npm start <device_name>` if you want to manually assign device names.
2. Execute `serverSetup()` in `Matlab` to establish connection. If directory `matlab` and `host` doesn't share the same parent folder, you need to specify the path of `host` folder as the argument.
The function returns a table of connected devices found on default ports of local network as follows.

    | DeviceName | Address  | Port |
    |------------|----------|------|
    | "myDevice" | "192.168.xxx.xxx" | 8085 |
    | ... | ... | ...|
3. If you have a preassigned time stamp file, you can call `timeStampStart(path_of_timestamp_file, list_of_paths_of_audio_files)` to start a remote control as used in Web UI. This method is recommanded if you want a more precise timing.
4. If you want to instantly call a remote device make certain sound, we can call `remoteSound(audio, device [, volume, Fs])`. 
    - `audio` can be either a signal as called in Matlab built-in function `Sound()`, or a string specifying the path to an audio file.
    - `device` can be either a name showed as the __DeviceName__ in the table, or any indexing variable (integer or logical array) indexing the device in the table.
    - `volume` is the percentage of volume to play with default value being 100%.
    - `Fs` is the sampling frequency (used only when `audio` is a signal) with default value being 8192 Hz.
5. To prevent too many files occupying the memory, you can call `clearAudioFiles()` to clear the cache of the server.