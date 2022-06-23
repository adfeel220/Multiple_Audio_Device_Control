import sys
from pygame import mixer
import json
from time import sleep, time
from datetime import datetime, timezone


WAIT_TIME_LIMIT = 3000  # system start waiting time limit [ms]


import platform
# For raspberry pi
EXE_ON_PI = False   # Check if the program is running on raspberry pi
if platform.machine().startswith('arm'):
    import board
    import adafruit_ws2801
    EXE_ON_PI = True

    # Pin config
    LED_0_CKI = board.D11   # The CKI/CI pin for the 1st LED
    LED_0_SDI = board.D10   # The SDI/DI pin for the 1st LED
    LED_1_CKI = board.D21   # The CKI/CI pin for the 2nd LED
    LED_1_SDI = board.D20   # The SDI/DI pin for the 2nd LED

    LED_NUM = 5
    bright = 1.0


# Instantly print the string on the terminal
# - So that we can print message in real time when open by another shell
# - STD doesn't automatcally flush the output stream when executed by another shell
def printInst(message, end='\n'):
    print(message, end=end)
    sys.stdout.flush()

# Play the predefined script and music
# Return true after finishing all events
def play(_dir, events, startEventIndex, timeIntervals, led_controller):
    printInst('Start playing pre-defined audio scripts...')

    # Go through all the scheduled events
    # Starting from the first event after the specified starting time
    for i in range(startEventIndex, len(events)):

        # Wait for the next playing event to happen
        printInst(f'Wait {timeIntervals[i - startEventIndex]} seconds to ', end='')
        sleep(timeIntervals[i - startEventIndex])

        # Determine if the coming event is a new audio track
        if events[i]['type'][0].lower() == 'n':
            # Get the audio file name to play
            audioFileName = events[i]['audioFile']

            # Load the audio file stream for playing
            # mixer.music should be stream playing, shouldn't have problem of long loading time
            # If issue of long loading time happens, maybe try to change this part to mixer.Sound()
            mixer.music.load(_dir + audioFileName)

            # If the event contains a volume setting, also change the volume
            if events[i]['volume'] > -1:
                # The volume info stored in an event is 0-100, while mixer.music requires 0.0-1.0 input,
                # thus we need to convert the number to 0-1 scale
                volume = events[i]['volume'] / 100.0
                mixer.music.set_volume(volume)

            # Play the music
            printInst(f'play {audioFileName}')
            mixer.music.play()

        # Determine if the event is to set volume
        elif events[i]['type'][0].lower() == 'v':
            # Read the volume stored in events, note that the scale is 0-100
            volume = events[i]['volume']

            printInst(f'set volume to {volume}%')
            volume = volume / 100.0             # Change the volume to 0.0-1.0 scale
            
            # Change volume
            mixer.music.set_volume(volume)


        # Determine if the event is to set LED light
        elif events[i]['type'][0].lower() == 'l':
            # Ignore lighting if it's not on Raspberry pi
            if not EXE_ON_PI:
                continue
            # Read the led index and the color stored in events
            led_idx = events[i]['led_index']
            strip_idx = events[i]['strip']
            color = tuple(events[i]['color'])

            # Ensure the LED controller is defined
            if led_controller is None:
                printInst(f'Unable to control LED on current machine \'{platform.machine()}\'')

            printInst(f'set LED \'{led_idx}\' on the \'{strip_idx}\'e strip to color {color}')
            
            # Change color
            led_controller[strip_idx][led_idx] = color

        if EXE_ON_PI:
            # update only when we need to wait for the next event
            if i+1 < len(events) and timeIntervals[i+1 - startEventIndex]>0 or i+1==len(events):
                led_controller[0].show()
                led_controller[1].show()

    # Return for successful playing
    return True
        



# Listen from the command from the NODE controller
def Listen(led_controller):
    printInst('Python audio controller start listening...')

    # By default, the problem will only be executed once,
    # to avoid too many python processes occupying system resources,
    #
    # isPlayed controls whether the progarm should be terminated or not
    isPlayed = False

    # Keep listening from the command sent from the NODE controller
    while True:
        time_start = time()
        # Read the command sent from the NODE controller via python shell
        command = sys.stdin.readline()

        # Upon receiving a message from the controller 
        if command:

            # Since the command is in the format of "{Command type} {Content} ..."
            # We first determine which kind of command is it.

            # Check command type
            ord = command.split(' ', 1)
            # So that 'ord' = [{Command name}, {rest of the content}]


            # The case when NODE controller informs the directory of audio files
            if ord[0].casefold() == 'DIR'.casefold():
                _dir = ord[1][:-1]          # this is a weird one, but somehow '_dir' has a '\n' at the end, so we need to trim it out
                printInst('Set directory to ' + _dir)


            # The case when we are loading events
            # 
            # The contents within this message is a list of JSON events defined in time stamp files
            # Note that in python the json format is a dictionary
            #
            # Also parse again to obtain both starting index and time intervals
            # - Starting events Index: the first event after the starting time
            # - Time Intervals: the waiting times between each event
            # Note that these 2 variables are strings upon loading
            if ord[0].casefold() == 'LOAD-events'.casefold():
                event_str, startingEventIndex, timeIntervals = ord[1].split(' ', 2)
                timeIntervals = timeIntervals[:-1]
                # print((event_str, startingEventIndex, timeIntervals))
                # events = json.loads(ord[1])
                events = json.loads(event_str)
                printInst('----- New events loaded -----')
                printInst(events)
                printInst('----------------------------')

                # Transform timeIntervals into proper lists for further usage
                timeIntervals = json.loads(timeIntervals)


            # Start to play the events
            # The message is 'Play {starting event index} {list of time intervals}'
            if ord[0].casefold() == 'Play'.casefold():
                sys_start, timediff = ord[1].split(' ')
                sys_start = int(sys_start)
                timediff = int(timediff)

                # Some weird situation happens where suppose waittime exceed default maximum waiting time (3s)
                if sys_start + timediff - int(time()*1000) < WAIT_TIME_LIMIT:
                    # wait until the designate time
                    while int(time()*1000) < sys_start+timediff:
                        pass
                
                # Play the events
                isPlayed = play(_dir, events, int(startingEventIndex), timeIntervals, led_controller)

        # Termination criteria:
        # 1- All the events are played and finished, already exited from the function 'play'
        # 2- The music stops playing anymore
        # If we don't check the 2nd criterion, the program may terminate before the last event finishes
        if isPlayed and not mixer.music.get_busy():
            break

    # led_controller[0].fill((0,0,0))
    # led_controller[0].show()
    # led_controller[1].fill((0,0,0))
    # led_controller[1].show()
    printInst('Python Shell Terminated')

                
                

# Execute the main part
if __name__ == '__main__':
    # Init mixer
    mixer.init(frequency=44100)

    if EXE_ON_PI:
        # Init LED strip
        led2801_controls = [
            adafruit_ws2801.WS2801(LED_0_CKI, LED_0_SDI, LED_NUM, brightness=bright, auto_write=False),
            adafruit_ws2801.WS2801(LED_1_CKI, LED_1_SDI, LED_NUM, brightness=bright, auto_write=False)
        ]
    else:
        led2801_controls = None

    # Wait for the command from NODE instructions
    Listen(led2801_controls)
