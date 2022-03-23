function light_info = setLightConfig(strip_idx, led_idx, red, green, blue)
    % Help create an led light object to speficy how to light up a led 
    % strip_idx: 0 or 1. The index of which strip to light
    % led_idx: index starts from 0. The index of the LED on that strip
    % red, green, blue: RGB value from 0-255

    % Example:
    % setLightConfig(0, 0, 255, 0, 0)   -- create a info struct labeling the first LED of first strip as read

    light_info.strip = strip_idx;
    light_info.led   = led_idx;
    light_info.red   = red;
    light_info.green = green;
    light_info.blue  = blue;
end