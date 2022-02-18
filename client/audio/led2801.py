# install adafruit-circuitpython-ws2801 first
from distutils.log import error
import adafruit_ws2801

class ws2801_controller:
    '''Control the ws2801 module'''
    def __init__(self, cki, sdi, led_length, brightness=1.0) -> None:
        '''
        cki: the pin on RPI which attaches to the CKI/CI pin on WS2801. e.g. board.D4 for GPIO#4
        sdi: the pin on RPI which attaches to the SDI/DI pin on WS2801. e.g. board.D6 for GPIO#6
        led_length: number of LED sub-modules attached
        brightness: 0.0-1.0 value for the brightness
        '''
        self.pixels = adafruit_ws2801.WS2801(cki, sdi, led_length, brightness=brightness, auto_write=False)

    def __len__(self):
        return len(self.pixels)

    def clear(self) -> None:
        self.pixels.fill((0,0,0))

    def setColor(self, led_idx:int, color:tuple) -> None:
        '''
        Assign the pixel with the specific index the assign color

        led_idx: the index of the LED which needs to change color. Should smaller than maximum length defined at the beginning
        color: a tuple of RGB value (R, G, B) range from 0-255
        '''

        # Check if index is valid
        if led_idx >= len(self):
            error(f'Invalid pixel index \'{led_idx}\', should smaller than the length \'{len(self)}\'')

        # Check if the color is valid
        if not (color[0] >= 0 and color[0] < 256):
            error(f'Red value invalid, expect 0-255 but get {color[0]}')
        if not (color[1] >= 0 and color[1] < 256):
            error(f'Green value invalid, expect 0-255 but get {color[1]}')
        if not (color[2] >= 0 and color[2] < 256):
            error(f'Blue value invalid, expect 0-255 but get {color[2]}')

        # Change color
        self.pixels[led_idx] = color
        self.pixels.show()
