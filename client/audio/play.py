import sys
from pygame import mixer
import json
from time import sleep

# Instantly print the string on the terminal
# - So that we can print message in real time when open by another shell
# - STD doesn't automatcally flush the output stream when executed by another shell
def printInst(message, end='\n'):
    print(message, end=end)
    sys.stdout.flush()

# Play the predefined script and music
# Return true after finishing all events
def play(_dir, events, startEventIndex, timeIntervals):
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

    # Return for successful playing
    return True
        



# Listen from the command from the NODE controller
def Listen():
    printInst('Python audio controller start listening...')

    # By default, the problem will only be executed once,
    # to avoid too many python processes occupying system resources,
    #
    # isPlayed controls whether the progarm should be terminated or not
    isPlayed = False

    # Keep listening from the command sent from the NODE controller
    while True:
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
            if ord[0].casefold() == 'LOAD-events'.casefold():
                events = json.loads(ord[1])
                printInst('----- New events loaded -----')
                printInst(events)
                printInst('----------------------------')


            # Start to play the events
            # The message is 'Play {starting event index} {list of time intervals}'
            if ord[0].casefold() == 'Play'.casefold():
                # Parse again to obtain both starting index and time intervals
                # - Starting events Index: the first event after the starting time
                # - Time Intervals: the waiting times between each event
                # Note that these 2 variables are strings upon loading
                [startingEventIndex, timeIntervals] = ord[1].split(' ', 1)

                # Transform timeIntervals into proper lists for further usage
                timeIntervals = json.loads(timeIntervals)

                # Play the events
                isPlayed = play(_dir, events, int(startingEventIndex), timeIntervals)

        # Termination criteria:
        # 1- All the events are played and finished, already exited from the function 'play'
        # 2- The music stops playing anymore
        # If we don't check the 2nd criterion, the program may terminate before the last event finishes
        if isPlayed and not mixer.music.get_busy():
            break


    printInst('Python Shell Terminated')

                
                

# Execute the main part
if __name__ == '__main__':
    # Init mixer
    mixer.init(frequency=44100)

    # Wait for the command from NODE instructions
    Listen()
