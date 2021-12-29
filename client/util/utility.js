

// Convert time string as '{min}:{sec}' into number measured in second
function timeStr2sec(timeStr) {
    // Assign 0 if the string is empty
    if (!timeStr.trim()) {
        return 0;
    }

    let min_sec = timeStr.split(':');   // min_sec = ['{minute}', '{second}']
    let second = Number(min_sec[0]) * 60 + Number(min_sec[1]);

    return second;
}

export { timeStr2sec }