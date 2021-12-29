---
title: Manual of Multiple Audio Control System
---

# How to start
First, to implement this system, make sure:
1. NodeJS and npm is installed in your device.
2. Any version of Python3 in installed in your device.
    You also need to install 'pygame' package to your device. You can simply use __pip install pygame__ command to install.
3. Use the 'host' version of this program on your main controller computer.
4. Use the 'client' version of this program on your remote devices to control speakers. These devices can be any computers or RPI. Basically any machine which has a suitable audio driver for your audio, and can run NodeJS and Python is good.
    Additionally, host and client can exist on the same computer. i.e. you can use 1 computer serve as host and client at the same time. Just ensure your host and client use different port number.
5. In each folder, there is a file called 'app.js'. You need to specify the IP and port number at the top section of this file.
6. Make sure all devices are connected within the same wifi domain, usually connecting to the same WIFI router should be enough. It doesn't matter if the WIFI is connected to the Internet or not, it can be offline.
7. Check the assigned IP address of each device. You may use 'ifconfig' to check the local IP with 192.168.xxx.xxx. Make sure the IP number defined in 'app.js' is the same with that defined by the WIFI router. You may also want to use fixed IP address rather than dynamic address if possible.
8. Once these settings are find, execute 'npm start' in the folder 'host' or 'client'.
9. Connect to the IP address you defined in 'host/app.js' by your browser. Note that host can be 'localhost' (i.e. 127.0.0.1). It's just a user interface, setting to localhost doesn't matter.
10. Start using by the UI on the Web!

# Careful when you use the program
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

You can click the "check' button at any time to update the status.

After you click 'ready', you may press 'check' again. If there's a '== Ready' at the end of the device, it means the device has finished all the prepartion works and ready to play.

## How to update the list of remote devices
Here's a brief explaination for you to change the device list.
You basically only enter a string in the format of **{Device name}@{IP address}:{port number}** and then press update. The functionalities depend on the following cases:
1. Neither the device name nor the IP address exist in the list.
    ==> Create a new device with the name and address entered.
2. The device name exists but the IP or port number is different.
    ==> Change the device with the same name with new IP and port number.
3. The IP already exists but the name or port number is different.
    ==> Change the name and port for the device with that IP.
4. Exists a device with the same name and IP, but different port.
    ==> Change the port to the new number.
5. Exists a device with exactly the same name, IP, and port.
    ==> Delete the device from the list.

# Buttons
Upload and delete buttons should be intuitive. You can also use the list in the 'Delete file' section to check the files already on the system.

Once the file modification is finished, you may press 'sync' to synchronize all the files and directories. Attention that this should be done when all the desired devices are connected.

# Ready to Start
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


# Ready and Play
It's normal to see the files or starting time disappear after you press ready. After 'ready', you may directly press 'play' to start the program. If you want to check if the programs are ready, you may press the 'check' button at the connection status section. If the devices have '== Ready' attached at the end, it means the devices are ready.