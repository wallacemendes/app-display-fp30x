# FP-30X MIDI Implementation

MIDI Implementation
  Model： FP-30X
  Date： Aug. 1. 2021
 Version： 1.00

## 1.Receive Data


### Channel Voice Messages


#### Note Off


| Status | 2nd byte | 3rd byte |
|---|---|---|
| 8nH | kkH | vvH |
| 9nH | kkH | 00H |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
kk = note number:                       00H–7FH (0–127)
vv = note off velocity:                 00H–7FH (0–127)
* For the drum part, this message is not received by certain instruments.

#### Note On


| Status | 2nd byte | 3rd byte |
|---|---|---|
| 9nH | kkH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
kk = note number:                       00H–7FH (0–127)
vv = note on velocity:                  01H–7FH (1–127)

#### Control Change

* The value specified by a Control Change message will not be reset even by a Program Change, etc.

##### Bank Select (Controller Number 0, 32)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 00H | mmH |
| BnH | 20H | llH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
mm, ll = Bank number:                   00H, 00H–7FH, 7FH (bank.1–bank.16384), 
                                        Initial Value = 00 00H (bank.1)
* If “GM1 System On” is received, Bank Select is not received.
* Bank Select is transmitted at power-on and when “GM2 System On” is received.
* Bank Select processing will be suspended until a Program Change message is received.

##### Modulation (Controller Number 1)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 01H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Modulation depth:                  00H–7FH (0–127)
* The resulting effect is determined by System Exclusive messages. With the initial settings, this is Pitch Modulation Depth.

##### Portamento Time (Controller Number 5)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 05H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Portamento Time:                   00H–7FH (0–127), Initial value = 00H (0)
* This adjusts the rate of pitch change when Portamento is ON or when using the Portamento Control. A value of 0 results in the 
fastest change.

##### Data Entry (Controller Number 6, 38)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 06H | mmH |
| BnH | 26H | llH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
mm, ll = the value of the parameter specified by RPN
mm = MSB, ll = LSB

##### Volume (Controller Number 7)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 07H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Volume:                            00H–7FH (0–127), Initial Value = 64H (100)
* Volume messages are used to adjust the volume balance of each Part.

##### Pan (Controller Number 10)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 0AH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = pan:                               00H–40H–7FH (Left–Center–Right), 
                                        Initial Value = 40H (Center)
* For Rhythm Parts, this is a relative adjustment of each Instrument’s pan setting.
* Some Tones might not be capable of being panned all the way to the left or right, or might not be able to respond to this message.

##### Expression (Controller Number 11)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 0BH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Expression:                        00H–7FH (0–127), Initial Value = 7FH (127)
* This adjusts the volume of a Part. It can be used independently from Volume messages. Expression messages are used for musical 
expression within a performance; e.g., expression pedal movements, crescendo and decrescendo.

##### Hold 1 (Controller Number 64)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 40H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H–7FH (0–127)

##### Portamento (Controller Number 65)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 41H | vvH |
1

n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H–7FH (0–127)
                                        0–63 = OFF, 64–127 = ON

##### Sostenuto (Controller Number 66)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 42H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H–7FH (0–127)
                                        0–63 = OFF, 64–127 = ON

##### Soft (Controller Number 67)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 43H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H–7FH (0–127)
* Some Tones will not exhibit any change.

##### Resonance (Controller Number 71)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 47H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv= Resonance value (relative change):  00H–7FH(-64–0–+63),
                                        Initial value = 40H (no change)
* Some Tones will not exhibit any change.

##### Release Time (Controller Number 72)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 48H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Release Time value (relative change): 00H–7FH(-64–0–+63), 
                                        Initial value = 40H (no change)
* Some Tones will not exhibit any change.

##### Attack Time (Controller Number 73)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 49H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Attack time value (relative change): 00H–7FH(-64–0–+63),
                                        Initial value=40H (no change)
* Some Tones will not exhibit any change.

##### Cutoff (Controller Number 74)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 4AH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Cutoff value (relative change):    00H–7FH(-64–0–+63),
                                        Initial value = 40H (no change)
* Some Tones will not exhibit any change.

##### Decay Time (Controller Number 75)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 4BH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Decay Time value (relative change): 00H–7FH(-64–0–+63),
                                        Initial value = 40H (no change)
* Some Tones will not exhibit any change.

##### Vibrato Rate (Controller Number 76)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 4CH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Vibrato Rate value (relative change): 00H–7FH(-64–0–+63),
                                        Initial value = 40H (no change)
* Some Tones will not exhibit any change.

##### Vibrato Depth (Controller Number 77)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 4DH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Vibrato Depth Value (relative change): 00H–7FH(-64–0–+63),
                                        Initial Value = 40H (no change)
* Some Tones will not exhibit any change.

##### Vibrato Delay (Controller Number 78)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 4EH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Vibrato Delay value (relative change): 00H–7FH(-64–0–+63),
                                        Initial value=40H (no change)
* Some Tones will not exhibit any change.

##### Effect 1 (Reverb Send Level) (Controller Number 91)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 5BH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H–7FH (0–127), Initial Value = 28H (40)
* This message adjusts the Reverb Send Level of each Part.

##### Effect 3 (Chorus Send Level) (Controller Number 93)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 5DH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H–7FH (0–127), Initial Value = 00H (0)
* This message adjusts the Chorus Send Level of each Part.

##### RPN MSB/LSB (Controller Number 100, 101)



| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 65H | mmH |
| BnH | 64H | llH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
mm = upper byte (MSB) of parameter number specified by RPN
ll = lower byte (LSB) of parameter number specified by RPN
* The value specified by RPN will not be reset even by messages such as Program Change or Reset All Controller.
**RPN**
The RPN (Registered Parameter Number) messages are expanded control changes, and each function of an RPN is described by the MIDI 
Standard.

To use these messages, you must first use RPN MSB and RPN LSB messages to specify the parameter to be controlled, and then use Data Entry messages to specify the value of the specified parameter. 

Once an RPN parameter has been specified, all Data Entry messages received on that channel will modify the value of that parameter. To prevent accidents, it is recommended that you set RPN Null (RPN Number = 7FH 7FH) when you have finished setting the value of the desired parameter. Refer to Section 4. “Examples of actual MIDI 
messages” 

###### Example 4
On this instrument, RPN can be used to modify the following parameters.

RPN                 Data entry
MSB LSB             MSB LSB             Explanation
| 00H 00H | mmH ---             Pitch Bend Sensitivity |
                                        mm: 00H–18H (0–24 semitones),
                                        Initial Value = 02H (2 semitones)
                                        ll: ignored (processed as 00h)
                                        specify up to 2 octaves in semitone steps
| 00H 01H | mmH llH             Master Fine Tuning |
                                        mm, ll: 00 00H–40 00H–7F 7FH
                                        (-100–0–+99.99 cents),
                                        Refer to 4. Supplementary Material,
                                        “About Tuning” 
| 00H 02H | mmH ---             Master Coarse Tuning |
                                        mm: 00H–40H–7FH
                                        (-64–0–+63 semitones),
                                        ll: ignored (processed as 00h)
| 00H 05H | mmH llH             Modulation Depth Range |
                                        mm: 00H–04H (0–4 semitones)
                                        ll: 00H–7FH (0–100 cents)
                                        100/128 Cent/Value
| 7FH 7FH | --- ---             RPN null |
                                        Set a condition in which RPN is not 
                                        specified. The data entry messages
                                        after set RPN null will be ignored.
                                        (No Data entry messages are required
                                        after RPN null).
                                        Settings already made will not change.
                                        mm, ll: ignored

#### Program Change


| Status | 2nd byte |
|---|---|
| CnH | ppH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
pp = Program number:                    00H–7FH (prog.1–prog.128)
* The sound will change beginning with the next note-on after the Program Change is received.

#### Channel Pressure


| Status | 2nd byte |
|---|---|
| DnH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Channel Pressure:                  00H–7FH (0–127)
* The resulting effect is determined by System Exclusive messages. With the initial settings there will be no effect.

#### Pitch Bend Change


| Status | 2nd byte | 3rd byte |
|---|---|---|
| EnH | llH | mmH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
mm, ll = Pitch Bend value:              00 00H–40 00H–7F 7FH
                                        (-8192–0–+8191)
* The resulting effect is determined by System Exclusive messages. With the initial settings the effect is Pitch Bend.

### Channel Mode Messages


#### All Sounds Off (Controller Number 120)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 78H | 00H |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
* When this message is received, all currently-sounding notes on the corresponding channel will be turned off immediately.

#### Reset All Controllers (Controller Number 121)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 79H | 00H |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
* When this message is received, the following controllers will be set to their reset values.
Controller                         Reset value
Pitch Bend Change                  ±0 (Center)
Channel Pressure                   0 (off)
Modulation                         0 (off)
Expression                         127 (max)
Hold 1                             0 (off)
Portamento                         0 (off)
Sostenuto                          0 (off)
Soft                               0 (off)
RPN                                unset; previously set data will not change

#### All Notes Off (Controller Number 123)



| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 7BH | 00H |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
* When All Notes Off is received, all notes on the corresponding channel will be turned off.
  However if Hold 1 or Sostenuto is ON, the sound will be continued until these are turned off.

#### OMNI OFF (Controller Number 124)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 7CH | 00H |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
* The same processing will be carried out as when All Notes Off is received.

#### OMNI ON (Controller Number 125)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 7DH | 00H |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
* OMNI ON is only recognized as “All notes off”; the Mode doesn’t change (OMNI OFF remains).

#### MONO (Controller Number 126)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 7EH | mmH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
mm = mono number:                       01H (1)
* The same processing will be carried out as when All Notes Off is received, and the corresponding channel will be set to Mode 4 
(M=1). Only M=1 is supported.

#### POLY (Controller Number 127)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 7FH | 00H |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
* The same processing will be carried out as when All Notes Off is received, and the corresponding channel will be set to Mode 3.

### System Exclusive Message


| Status | Data byte | Status |
|---|---|---|
| F0H | iiH, ddH, ......, eeH | F7H |
F0H:                    System Exclusive Message status
ii = ID number:         An ID number (manufacturer ID) to indicate the
                        manufacturer whose Exclusive message this is.
                        Roland’s manufacturer ID is 41H.
                        ID numbers 7EH and 7FH are extensions of the
                        MIDI standard; Universal Non-realtime Messages
                        (7EH) and Universal Realtime Messages (7FH).
dd,...,ee = data:       00H–7FH (0–127)
F7H:                    EOX (End Of Exclusive)
The System Exclusive Messages received by this instrument are; messages related to mode settings, Universal Realtime System Exclusive
messages, and Universal Non-realtime System Exclusive messages.

#### System Exclusive Messages Related to Mode Settings

These messages are used to initialize a device to GM mode.
When creating performance data, you should insert “GM1 System On” at the beginning of a GM1 score, or “GM2 System On” at the 
beginning of a GM2 score. However, each song should contain only the single mode message that is appropriate for that song. (Do not 
insert multiple mode setting messages in the same song.)
“GM System On” uses Universal Non-realtime Message format.

##### GM1 System On

This is a command message that resets the internal settings of the unit to the General MIDI initial state (General MIDI System-Level 
1). After receiving this message, this instrument will automatically be set to the proper condition for correctly playing a GM1 
score.

| Status | Data byte | Status |
|---|---|---|
| F0H | 7EH, 7FH, 09H, 01H | F7H |

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7EH | ID number (Universal Non-realtime Message) |
| 7FH | Device ID (Broadcast) |
| 09H | Sub ID#1 (General MIDI Message) |
| 01H | Sub ID#2 (General MIDI 1 On) |
| F7H | EOX (End Of Exclusive) |
* Once this message is received, Bank Select is no longer received.
* There must be an interval of at least 50 ms between this message and the next.

##### GM2 System On

This is a command message that resets the internal settings of the unit to the General MIDI initial state (General MIDI System-Level 
2). After receiving this message, this instrument will automatically be set to the proper condition for correctly playing a GM2 
score.

| Status | Data byte | Status |
|---|---|---|
| F0H | 7EH 7FH 09H 03H | F7H |

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7EH | ID number (Universal Non-realtime Message) |
| 7FH | Device ID (Broadcast) |
| 09H | Sub ID#1 (General MIDI Message) |
| 03H | Sub ID#2 (General MIDI 2 On) |
| F7H | EOX (End Of Exclusive) |
* When this message is received, this instrument will be able to receive the messages specified by General MIDI 2, and use the 
General MIDI 2 soundmap.
* There must be an interval of at least 50 ms between this message and the next.

#### Universal Realtime System Exclusive Messages


##### Master Volume



| Status | Data byte | Status |
|---|---|---|
| F0H | 7FH, 7FH, 04H, 01H, llH, mmH | F7H |

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7FH | ID number (universal realtime message) |
| 7FH | Device ID (Broadcast) |
| 04H | Sub ID#1 (Device Control messages) |
| 01H | Sub ID#2 (Master Volume) |
llH            Master volume lower byte
mmH            Master volume upper byte
| F7H | EOX (End Of Exclusive) |
llH: ignored (processed as 00H)
mmH: 00H–7FH   0–127
* The lower byte (llH) of Master Volume will be handled as 00H.

##### Master Fine Tuning


| Status | Data byte | Status |
|---|---|---|
| F0H | 7FH, 7FH, 04H, 03H, llH, mmH | F7H |

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7FH | ID number (Universal Realtime Message) |
| 7FH | Device ID (Broadcast) |
| 04H | Sub ID#1 (Device Control) |
| 03H | Sub ID#2 (Master Fine Tuning) |
llH            Master Fine Tuning LSB
mmH            Master Fine Tuning MSB
| F7H | EOX (End Of Exclusive) |
llH, mmH: 00 00H–40 00H–7F 7FH (-100–0–+99.9 [cents])

##### Master Coarse Tuning


| Status | Data byte | Status |
|---|---|---|
| F0H | 7FH, 7FH, 04H, 04H, llH, mmH | F7H |

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7FH | ID number (Universal Realtime Message) |
| 7FH | Device ID (Broadcast) |
| 04H | Sub ID#1 (Device Control) |
| 04H | Sub ID#2 (Master Coarse Tuning) |
llH            Master Coarse Tuning LSB
mmH            Master Coarse Tuning MSB
| F7H | EOX (End Of Exclusive) |
llH:           ignored (processed as 00H)
mmH:           28H–40H–58H (-24–0–+24 [semitones])

#### Global Parameter Control

Parameters of the Global Parameter Control are newly provided for the General MIDI 2.

##### Reverb Parameters


| Status | Data byte | Status |
|---|---|---|
| F0H | 7FH, 7FH, 04H, 05H, 01H, 01H, | F7H |
               01H, 01H, 01H, ppH, vvH

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7FH | ID number (Universal Realtime Message) |
| 7FH | Device ID (Broadcast) |
| 04H | Sub ID#1 (Device Control) |
| 05H | Sub ID#2 (Global Parameter Control) |
| 01H | Slot path length |
| 01H | Parameter ID width |
| 01H | Value width |
| 01H | Slot path MSB |
| 01H | Slot path LSB (Effect 0101: Reverb) |
ppH            Parameter to be controlled.
vvH            Value for the parameter.
| F7H | EOX (End Of Exclusive) |
pp=0           Reverb Type
               vv = 00H        Small Room (Room1)
               vv = 01H        Medium Room (Room2)
               vv = 02H        Large Room (Room3)
               vv = 03H        Medium Hall (Hall1)
               vv = 04H        Large Hall (Hall2)
               vv = 08H        Plate (Plate)
pp=1           Reverb Time
               vv = 00H–7FH    0–127

##### Chorus Parameters


| Status | Data byte | Status |
|---|---|---|
| F0H | 7FH, 7FH, 04H, 05H, 01H, 01H, | F7H |
                   01H, 01H, 02H, ppH, vvH

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7FH | ID number (Universal Realtime Message) |
| 7FH | Device ID (Broadcast) |
| 04H | Sub ID#1 (Device Control) |
| 05H | Sub ID#2 (Global Parameter Control) |
| 01H | Slot path length |
| 01H | Parameter ID width |
5

| 01H | Value width |
| 01H | Slot path MSB |
| 02H | Slot path LSB (Effect 0102: Chorus) |
ppH            Parameter to be controlled.
vvH            Value for the parameter.
| F7H | EOX (End Of Exclusive) |
pp=0           Chorus Type
               vv = 00H        Chorus1
               vv = 01H        Chorus2
               vv = 02H        Chorus3
               vv = 03H        Chorus4
               vv = 04H        FB Chorus
               vv = 05H        Flanger
pp=1           Mod Rate
               vv = 00H–7FH    0–127
pp=2           Mod Depth
               vv = 00H–7FH    0–127
pp=3           Feedback
               vv = 00H–7FH    0–127
pp=4           Send To Reverb
               vv = 00H–7FH    0–127

##### Channel Pressure


| Status | Data byte | Status |
|---|---|---|
| F0H | 7FH, 7FH, 09H, 01H, 0nH, ppH, rrH | F7H |

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7FH | ID number (Universal Realtime Message) |
| 7FH | Device ID (Broadcast) |
| 09H | Sub ID#1 (Controller Destination Setting) |
| 01H | Sub ID#2 (Channel Pressure) |
0nH            MIDI Channel (00H–0FH)
ppH            Controlled parameter
rrH            Controlled range
| F7H | EOX (End Of Exclusive) |
pp=0           Pitch Control
               rr = 28H–58H    -24–+24 [semitones]
pp=1           Filter Cutoff Control
               rr = 00H–7FH    -9600–+9450 [cents]
pp=2           Amplitude Control
               rr = 00H–7FH    0–200 [%]
pp=3           LFO Pitch Depth
               rr = 00H–7FH    0–600 [cents]
pp=4           LFO Filter Depth
               rr = 00H–7FH    0–2400 [cents]
pp=5           LFO Amplitude Depth
               rr = 00H–7FH    0–100 [%]

##### Controller


| Status | Data byte | Status |
|---|---|---|
| F0H | 7FH, 7FH, 09H, 03H, 0nH, ccH, | F7H |
               ppH, rrH

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7FH | ID number (Universal Realtime Message) |
| 7FH | Device ID (Broadcast) |
| 09H | Sub ID#1 (Controller Destination Setting) |
| 03H | Sub ID#2 (Control Change) |
0nH            MIDI Channel (00H–0FH)
ccH            Controller number (00–1FH, 40–5FH)
ppH            Controlled parameter
rrH            Controlled range
| F7H | EOX (End Of Exclusive) |
pp=0           Pitch Control
               rr = 28H–58H    -24–+24 [semitones]
pp=1           Filter Cutoff Control
               rr = 00H–7FH    -9600–+9450 [cents]
pp=2           Amplitude Control
               rr = 00H–7FH    0–200 [%]
pp=3           LFO Pitch Depth
               rr = 00H–7FH    0–600 [cents]
pp=4           LFO Filter Depth
               rr = 00H–7FH    0–2400 [cents]
pp=5           LFO Amplitude Depth
               rr = 00H–7FH    0–100 [%]

##### Scale/Octave Tuning Adjust


| Status | Data byte | Status |
|---|---|---|
| F0H | 7EH, 7FH, 08H, 08H, ffH, ggH, | F7H |
               hhH, ssH...

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7EH | ID number (Universal Non-realtime Message) |
| 7FH | Device ID (Broadcast) |
| 08H | Sub ID#1 (MIDI Tuning Standard) |
| 08H | Sub ID#2 (scale/octave tuning 1-byte form) |
ffH            Channel/Option byte1
               bits 0 to 1 = channel 15 to 16
               bits 2 to 6 = Undefined
ggH            Channel byte2
6

               bits 0 to 6 = channel 8 to 14
hhH            Channel byte3
               bits 0 to 6 = channel 1 to 7
ssH            12 byte tuning offset of 12 semitones from C to B
               00H = -64 [cents]
               40H = 0 [cents] (equal temperament)
               7FH = +63 [cents]
| F7H | EOX (End Of Exclusive) |

##### Key-Based Instrument Controllers


| Status | Data byte | Status |
|---|---|---|
| F0H | 7FH, 7FH, 0AH, 01H, 0nH, | F7H |
               kkH, nnH, vvH...

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7FH | ID number (Universal Realtime Message) |
| 7FH | Device ID (Broadcast) |
| 0AH | Sub ID#1 (Key-Based Instrument Control) |
| 01H | Sub ID#2 (Controller) |
0nH            MIDI Channel (00–0FH)
kkH            Key Number
nnH            Controller Number
vvH            Value
| F7H | EOX (End Of Exclusive) |
nn=07H         Level
               vv = 00H–7FH    0–200 [%] (Relative)
nn=0AH         Pan
               vv = 00H–7FH    Left–Right (Absolute)
nn=5BH         Reverb Send
               vv = 00H–7FH    0–127 (Absolute)
nn=5DH         Chorus Send
               vv = 00H–7FH    0–127 (Absolute)
* This parameter effects drum instruments only.

#### Universal Non-realtime System Exclusive Messages


##### Identity Request Message


| Status | Data byte | Status |
|---|---|---|
| F0H | 7EH, 10H, 06H, 01H | F7H |

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7EH | ID number (Universal Non-realtime Message) |
| 10H | Device ID |
| 06H | Sub ID#1 (General Information) |
| 01H | Sub ID#2 (Identity Request) |
| F7H | EOX (End Of Exclusive) |
* Device ID = 10H or 7FH

## 2.Transmit Data


### Channel Voice Messages


#### Note Off


| Status | 2nd byte | 3rd byte |
|---|---|---|
| 8nH | kkH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
kk = note number:                       00H–7FH (0–127)
vv = note off velocity:                 00H–7FH (0–127)

#### Note On


| Status | 2nd byte | 3rd byte |
|---|---|---|
| 9nH | kkH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
kk = note number:                       00H–7FH (0–127)
vv = note on velocity:                  01H–7FH (1–127)

#### Control Change


##### Bank Select (Controller Number 0, 32)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 00H | mmH |
| BnH | 20H | llH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
mm, ll = Bank number:                   00H, 00H–7FH, 7FH (bank.1–bank.16384)

##### Volume (Controller Number 7)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 07H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Volume:                            00H–7FH (0–127), Initial Value = 64H (100)

##### Expression (Controller Number 11)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 0BH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Expression:                        00H–7FH (0–127), Initial Value = 7FH (127)

##### Hold 1 (Controller Number 64)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 40H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
7

vv = Control value:                     00H–7FH (0–127)

##### Sostenuto (Controller Number 66)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 42H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H-7FH (0-127)
                                        0 = OFF, 127 = ON

##### Soft (Controller Number 67)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 43H | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H–7FH (0–127)

##### Effect 1 (Reverb Send Level) (Controller Number 91)


| Status | 2nd byte | 3rd byte |
|---|---|---|
| BnH | 5BH | vvH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
vv = Control value:                     00H–7FH (0–127)

#### Program Change


| Status | 2nd byte |
|---|---|
| CnH | ppH |
n = MIDI channel number:                0H–FH (ch.1–ch.16)
pp = Program number:                    00H–7FH (prog.1–prog.128)

### System Exclusive Messages


##### Identity Reply


| Status | Data byte | Status |
|---|---|---|
| F0H | 7EH, 10H, 06H, 02H, 41H, 19H, 03H, | F7H |
               00H, 00H, 1CH, 01H, 00H, 00H

| Byte | Explanation |
|---|---|
| F0H | Exclusive status |
| 7EH | ID number (Universal Non-realtime Message) |
| 10H | Device ID |
| 06H | Sub ID#1 (General Information) |
| 02H | Sub ID#2 (Identity Reply) |
| 41H | ID number (Roland) |
| 19H | Device family code (LSB) |
| 03H | Device family code (MSB) |
| 00H | Device family number code (LSB) |
| 00H | Device family number code (MSB) |
| 1CH | Software revision level |
| 01H | Software revision level |
| 00H | Software revision level |
| 00H | Software revision level |
| F7H | EOX (End of Exclusive) |

## 3.Supplementary Material


#### Decimal and Hexadecimal Table

In MIDI documentation, data values and addresses/sizes of exclusive messages etc. are expressed as hexadecimal values for each 7 
bits.
The following table shows how these correspond to decimal numbers.
|  D   |  H   ||  D   |  H   ||  D   |  H   ||  D   |  H   |
|    0 |  00H ||   32 |  20H ||   64 |  40H ||   96 |  60H |
|    1 |  01H ||   33 |  21H ||   65 |  41H ||   97 |  61H |
|    2 |  02H ||   34 |  22H ||   66 |  42H ||   98 |  62H |
|    3 |  03H ||   35 |  23H ||   67 |  43H ||   99 |  63H |
|    4 |  04H ||   36 |  24H ||   68 |  44H ||  100 |  64H |
|    5 |  05H ||   37 |  25H ||   69 |  45H ||  101 |  65H |
|    6 |  06H ||   38 |  26H ||   70 |  46H ||  102 |  66H |
|    7 |  07H ||   39 |  27H ||   71 |  47H ||  103 |  67H |
|    8 |  08H ||   40 |  28H ||   72 |  48H ||  104 |  68H |
|    9 |  09H ||   41 |  29H ||   73 |  49H ||  105 |  69H |
|   10 |  0AH ||   42 |  2AH ||   74 |  4AH ||  106 |  6AH |
|   11 |  0BH ||   43 |  2BH ||   75 |  4BH ||  107 |  6BH |
|   12 |  0CH ||   44 |  2CH ||   76 |  4CH ||  108 |  6CH |
|   13 |  0DH ||   45 |  2DH ||   77 |  4DH ||  109 |  6DH |
|   14 |  0EH ||   46 |  2EH ||   78 |  4EH ||  110 |  6EH |
|   15 |  0FH ||   47 |  2FH ||   79 |  4FH ||  111 |  6FH |
|   16 |  10H ||   48 |  30H ||   80 |  50H ||  112 |  70H |
|   17 |  11H ||   49 |  31H ||   81 |  51H ||  113 |  71H |
|   18 |  12H ||   50 |  32H ||   82 |  52H ||  114 |  72H |
|   19 |  13H ||   51 |  33H ||   83 |  53H ||  115 |  73H |
|   20 |  14H ||   52 |  34H ||   84 |  54H ||  116 |  74H |
|   21 |  15H ||   53 |  35H ||   85 |  55H ||  117 |  75H |
|   22 |  16H ||   54 |  36H ||   86 |  56H ||  118 |  76H |
|   23 |  17H ||   55 |  37H ||   87 |  57H ||  119 |  77H |
|   24 |  18H ||   56 |  38H ||   88 |  58H ||  120 |  78H |
|   25 |  19H ||   57 |  39H ||   89 |  59H ||  121 |  79H |
|   26 |  1AH ||   58 |  3AH ||   90 |  5AH ||  122 |  7AH |
|   27 |  1BH ||   59 |  3BH ||   91 |  5BH ||  123 |  7BH |
|   28 |  1CH ||   60 |  3CH ||   92 |  5CH ||  124 |  7CH |
|   29 |  1DH ||   61 |  3DH ||   93 |  5DH ||  125 |  7DH |
|   30 |  1EH ||   62 |  3EH ||   94 |  5EH ||  126 |  7EH |
|   31 |  1FH ||   63 |  3FH ||   95 |  5FH ||  127 |  7FH |

D: decimal
H: hexadecimal
* Decimal values such as MIDI channel, bank select, and program change are listed as one (1) greater than the values given in the 
above table.
* A 7-bits byte can express data in the range of 128 steps. For data where greater precision is required, we must use two or more 
bytes. For example, two hexadecimal numbers aa bbH expressing two 7-bits bytes would indicate a value of aa x 128 + bb.
* In the case of values which have a ± sign, 00H = -64, 40H = ±0, and 7FH = +63, so that the decimal expression would be 64 less 
than the value given in the above chart. In the case of two types, 00 00H = -8192, 40 00H = ±0, and 7F 7FH = +8191. For example if 
aa bbH were expressed as decimal, this would be aa bbH - 40 00H = aa x 128 + bb - 64 x 128.
* Data marked “nibbled” is expressed in hexadecimal in 4-bits units. A value expressed as a 2-byte nibble 0a 0bH has the value of a
x 16 + b.
###### Example 1 
What is the decimal expression of 5AH?
>From the preceding table, `5AH = 90`
###### Example 2 
What is the decimal expression of the value 12 34H given as hexadecimal for each 7 bits?
>From the preceding table, since `12H = 18` and `34H = 52`
`18 x 128 + 52 = 2356`
###### Example 3 
What is the decimal expression of the nibbled value 0A 03 09 0D?
>From the preceding table, since `0AH = 10`, `03H = 3`, `09H = 9`, `0DH = 13`
`((10 x 16 + 3) x 16 + 9) x 16 + 13 = 41885`
###### Example 4 
What is the nibbled expression of the decimal value 1258?

```txt
16) 1258
16)   78... 10
16)    4... 14
--------------
       0... 4
```

Since from the preceding table, 0 = 00H, 4 = 04H, 14 = 0EH, 10 = 0AH, the answer is 00 04 0E 0AH.

#### Examples of Actual MIDI Messages

###### Example 1 92 3E 5F
9n is the Note-on status, and n is the MIDI channel number. Since `2H = 2`, `3EH = 62`, and `5FH = 95`, this is a Note-on message with MIDI
`CH = 3`, `note number 62` (note name is D4), and `velocity 95`.
###### Example 2 CE 49
| CnH is the Program Change status, and n is the MIDI channel number. Since `EH = 14` and `49H = 73`, this is a Program Change message with |
`MIDI CH = 15`, program number 74 (Flute in GS).
###### Example 3 EA 00 28
| EnH is the Pitch Bend Change status, and n is the MIDI channel number. The 2nd byte (00H = 0) is the LSB and the 3rd byte (28H = 40) |
is the MSB, but Pitch Bend Value is a signed number in which 40 00H (= 64 x 128 + 0 = 8192) is 0, so this Pitch Bend Value is 28 00H 
 `-40 00H = 40 x 128 + 0 - (64 x 128 + 0) = 5120 - 8192 = -3072`
If the Pitch Bend Sensitivity is set to 2 semitones, -8192 (00 00H) will cause the pitch to change 200 cents, so in this case -200 x 
`(-3072) / (-8192) = -75 cents of Pitch Bend is being applied to MIDI channel 11.`
###### Example 4 B3 64 00 65 00 06 0C 26 00 64 7F 65 7F
BnH is the Control Change status, and n is the MIDI channel number. For Control Changes, the 2nd byte is the controller number, and |
the 3rd byte is the value. In a case in which two or more messages consecutive messages have the same status, MIDI has a provision 
called “running status” which allows the status byte of the second and following messages to be omitted. Thus, the above messages 
have the following meaning.

-  B3   64 00    MIDI ch.4, lower byte of RPN parameter number:   00H
- (B3)  65 00   (MIDI ch.4) upper byte of RPN parameter number:   00H
- (B3)  06 0C   (MIDI ch.4) upper byte of parameter value:   0CH
- (B3)  26 00   (MIDI ch.4) lower byte of parameter value:   00H
- (B3)  64 7F   (MIDI ch.4) lower byte of RPN parameter number:   7FH
- (B3)  65 7F   (MIDI ch.4) upper byte of RPN parameter number:   7FH
In other words, the above messages specify a value of 0C 00H for RPN parameter number 00 00H on MIDI channel 4, and then set the RPN 
parameter number to 7F 7FH.
RPN parameter number 00 00H is Pitch Bend Sensitivity, and the MSB of the value indicates semitone units, so a value of 0CH = 12 sets
the maximum pitch bend range to +/- 12 semitones (1 octave). (On GS sound sources the LSB of Pitch Bend Sensitivity is ignored, but 
the LSB should be transmitted anyway (with a value of 0) so that operation will be correct on any device.)
Once the parameter number has been specified for RPN, all Data Entry messages transmitted on that same channel will be valid, so 
after the desired value has been transmitted, it is a good idea to set the parameter number to 7F 7FH to prevent accidents. This is 
the reason for the (B3) 64 7F (B3) 65 7F at the end.
It is not desirable for performance data (such as Standard MIDI File data) to contain many events with running status as given in 
###### Example 4. This is because if playback is halted during the song and then rewound or fast-forwarded, the sequencer may not be able 
to transmit the correct status, and the sound source will then misinterpret the data. Take care to give each event its own status.
It is also necessary that the RPN parameter number setting and the value setting be done in the proper order. On some sequencers, 
events occurring in the same (or consecutive) clock may be transmitted in an order different than the order in which they were 
received. For this reason it is a good idea to slightly skew the time of each event (about 1 tick for TPQN = 96, and about 5 ticks 
for TPQN = 480).
* TPQN: Ticks Per Quarter Note

#### About Tuning

In MIDI, individual Parts are tuned by sending RPN #1 (Master Fine Tuning) to the appropriate MIDI channel.
In MIDI, all parts can be tuned by sending RPN#1 to each of the MIDI channels that you are using.
RPN#1 allows you to specify the tuning with an accuracy of approximately 0.012 cents (to be precise, 100/8192 cents). 
One cent is 1/100th of a semitone.

Frequently used tuning values are given in the following table for your reference. Values are in hexadecimal (decimal in 
parentheses).
| Hz in A4 |  cent  |     RPN #1    |
|   445.0  | +19.56 | 4C 43 (+1603) |
|   444.0  | +15.67 | 4A 03 (+1283) |
|   443.0  | +11.76 | 47 44 (+ 964) |
|   442.0  |  +7.85 | 45 03 (+ 643) |
|   441.0  |  +3.93 | 42 42 (+ 322) |
|   440.0  |   0.00 | 40 00 (    0) |
|   439.0  |  -3.94 | 3D 3D (- 323) |
|   438.0  |  -7.89 | 3A 7A (- 646) |
###### Example  Set the tuning of MIDI channel 3 to A4 = 442.0 Hz
Send RPN#1 to MIDI channel 3. From the above table, the value is 45 03H.
 B2   64 01    MIDI ch.3, lower byte of RPN parameter number:   01H
(B2)  65 00   (MIDI ch.3) upper byte of RPN parameter number:   00H
(B2)  06 45   (MIDI ch.3) upper byte of parameter value:   45H
(B2)  26 03   (MIDI ch.3) lower byte of parameter value:   03H
(B2)  64 7F   (MIDI ch.3) lower byte of RPN parameter number:   7FH
(B2)  65 7F   (MIDI ch.3) upper byte of RPN parameter number:   7FH

## 4.Tone List

### Piano

| No. | Name | MSB | LSB | PC |
|---|---|---|---|---|
| 1 | Concert Piano | 0 | 68 | 1 |
| 2 | Ballad Piano | 16 | 67 | 1 |
| 3 | Mellow Piano | 4 | 64 | 1 |
| 4 | Bright Piano | 8 | 66 | 2 |
| 5 | Upright Piano | 16 | 64 | 1 |
| 6 | Mellow Upright | 1 | 65 | 1 |
| 7 | Bright Upright | 1 | 66 | 1 |
| 8 | Rock Piano | 8 | 64 | 3 |
| 9 | Ragtime Piano | 0 | 64 | 4 |
| 10 | Magical Piano | 47 | 65 | 3 |
| 11 | Harpsichord | 0 | 67 | 7 |
| 12 | Harpsi 8'+4' | 8 | 67 | 7 |
### E.Piano

| No. | Name | MSB | LSB | PC |
|---|---|---|---|---|
| 1 | 1976SuitCase | 8 | 71 | 5 |
| 2 | Wurly 200 | 25 | 64 | 5 |
| 3 | Phase EP Mix | 8 | 68 | 5 |
| 4 | 80's FM EP | 0 | 68 | 6 |
| 5 | Clav. | 121 | 0 | 8 |
| 6 | Vibraphone | 121 | 0 | 12 |
| 7 | Celesta | 121 | 0 | 9 |
| 8 | B.Organ Slow | 1 | 65 | 19 |
| 9 | Combo Jz.Org | 0 | 70 | 19 |
| 10 | Ballad Organ | 0 | 69 | 19 |
| 11 | Gospel Spin | 0 | 71 | 17 |
| 12 | Full Stops | 0 | 69 | 17 |
| 13 | Mellow Bars | 32 | 68 | 17 |
| 14 | Lower Organ | 0 | 66 | 17 |
| 15 | Light Organ | 32 | 69 | 17 |
| 16 | Pipe Organ | 8 | 70 | 20 |
| 17 | Nason Flt 8' | 16 | 66 | 20 |
| 18 | ChurchOrgan1 | 0 | 66 | 20 |
| 19 | ChurchOrgan2 | 8 | 69 | 20 |
| 20 | Accordion | 121 | 0 | 22 |
### Other

| No. | Name | MSB | LSB | PC |
|---|---|---|---|---|
| 1 | Epic Strings | 1 | 67 | 49 |
| 2 | Rich Strings | 0 | 71 | 50 |
| 3 | SymphonicStr1 | 1 | 67 | 50 |
| 4 | SymphonicStr2 | 1 | 65 | 50 |
| 5 | Orchestra | 8 | 66 | 49 |
| 6 | String Trio | 0 | 64 | 41 |
| 7 | Harpiness | 0 | 70 | 47 |
| 8 | OrchestraBrs | 1 | 66 | 61 |
| 9 | Super SynPad | 1 | 71 | 90 |
| 10 | Choir Aahs 1 | 8 | 71 | 53 |
| 11 | Choir Aahs 2 | 8 | 72 | 53 |
| 12 | D50 StackPad | 1 | 64 | 89 |
| 13 | JP8 Strings | 0 | 68 | 51 |
| 14 | Soft Pad | 0 | 64 | 90 |
| 15 | Solina | 0 | 66 | 51 |
| 16 | Super Saw | 8 | 67 | 82 |
| 17 | Trancy Synth | 1 | 65 | 91 |
| 18 | Flip Pad | 1 | 64 | 91 |
| 19 | Jazz Scat | 0 | 65 | 55 |
| 20 | Comp'd JBass | 0 | 66 | 34 |
| 21 | Nylon-str.Gt | 121 | 0 | 25 |
| 22 | Steel-str.Gt | 121 | 0 | 26 |
| 23 | AcousticBass | 121 | 0 | 33 |
| 24 | A.Bass+Cymbl | 0 | 66 | 33 |
### Drums

| No. | Name | MSB | LSB | PC |
|---|---|---|---|---|
| 1 | Standard Set | 120 | 0 | 1 |
| 2 | Room Set | 120 | 0 | 9 |
| 3 | Power Set | 120 | 0 | 17 |
| 4 | Electric Set | 120 | 0 | 25 |
| 5 | Analog Set | 120 | 0 | 26 |
| 6 | Jazz Set | 120 | 0 | 33 |
| 7 | Brush Set | 120 | 0 | 41 |
| 8 | Orchestra Set | 120 | 0 | 49 |
| 9 | SFX Set | 120 | 0 | 57 |
### GM2

| No. | Name | MSB | LSB | PC |
|---|---|---|---|---|
| 1 | Piano 1 | 121 | 0 | 1 |
| 2 | Piano 1w | 121 | 1 | 1 |
| 3 | Piano 1d | 121 | 2 | 1 |
| 4 | Piano 2 | 121 | 0 | 2 |
| 5 | Piano 2w | 121 | 1 | 2 |
| 6 | Piano 3 | 121 | 0 | 3 |
| 7 | Piano 3w | 121 | 1 | 3 |
| 8 | Honky-tonk | 121 | 0 | 4 |
| 9 | Honky-tonk w | 121 | 1 | 4 |
| 10 | E.Piano 1 | 121 | 0 | 5 |
| 11 | Detuned EP 1 | 121 | 1 | 5 |
| 12 | Vintage EP | 121 | 2 | 5 |
| 13 | 60's E.Piano | 121 | 3 | 5 |
| 14 | E.Piano 2 | 121 | 0 | 6 |
| 15 | Detuned EP 2 | 121 | 1 | 6 |
| 16 | St.FM EP | 121 | 2 | 6 |
| 17 | EP Legend | 121 | 3 | 6 |
| 18 | EP Phaser | 121 | 4 | 6 |
| 19 | Harpsi. | 121 | 0 | 7 |
| 20 | Coupled Hps. | 121 | 1 | 7 |
| 21 | Harpsi.w | 121 | 2 | 7 |
| 22 | Harpsi.o | 121 | 3 | 7 |
| 23 | Clav. | 121 | 0 | 8 |
| 24 | Pulse Clav. | 121 | 1 | 8 |
| 25 | Celesta | 121 | 0 | 9 |
| 26 | Glockenspiel | 121 | 0 | 10 |
| 27 | Music Box | 121 | 0 | 11 |
| 28 | Vibraphone | 121 | 0 | 12 |
| 29 | Vibraphone w | 121 | 1 | 12 |
| 30 | Marimba | 121 | 0 | 13 |
| 31 | Marimba w | 121 | 1 | 13 |
| 32 | Xylophone | 121 | 0 | 14 |
| 33 | TubularBells | 121 | 0 | 15 |
| 34 | Church Bell | 121 | 1 | 15 |
| 35 | Carillon | 121 | 2 | 15 |
| 36 | Santur | 121 | 0 | 16 |
| 37 | Organ 1 | 121 | 0 | 17 |
| 38 | TremoloOrgan | 121 | 1 | 17 |
| 39 | 60's Organ | 121 | 2 | 17 |
| 40 | Organ 2 | 121 | 3 | 17 |
| 41 | Perc.Organ 1 | 121 | 0 | 18 |
| 42 | Chorus Organ | 121 | 1 | 18 |
| 43 | Perc.Organ 2 | 121 | 2 | 18 |
| 44 | Rock Organ | 121 | 0 | 19 |
| 45 | Church Org.1 | 121 | 0 | 20 |
| 46 | Church Org.2 | 121 | 1 | 20 |
| 47 | Church Org.3 | 121 | 2 | 20 |
| 48 | Reed Organ | 121 | 0 | 21 |
| 49 | Puff Organ | 121 | 1 | 21 |
| 50 | Accordion 1 | 121 | 0 | 22 |
| 51 | Accordion 2 | 121 | 1 | 22 |
| 52 | Harmonica | 121 | 0 | 23 |
| 53 | Bandoneon | 121 | 0 | 24 |
| 54 | Nylon-str.Gt | 121 | 0 | 25 |
| 55 | Ukulele | 121 | 1 | 25 |
| 56 | Nylon Gt o | 121 | 2 | 25 |
| 57 | Nylon Gt 2 | 121 | 3 | 25 |
| 58 | Steel-str.Gt | 121 | 0 | 26 |
| 59 | 12-str.Gt | 121 | 1 | 26 |
| 60 | Mandolin | 121 | 2 | 26 |
| 61 | Steel+Body | 121 | 3 | 26 |
| 62 | Jazz Guitar | 121 | 0 | 27 |
| 63 | Hawaiian Gt | 121 | 1 | 27 |
| 64 | Clean Guitar | 121 | 0 | 28 |
| 65 | Chorus Gt 1 | 121 | 1 | 28 |
| 66 | Mid Tone Gt | 121 | 2 | 28 |
| 67 | Muted Guitar | 121 | 0 | 29 |
| 68 | Funk Guitar1 | 121 | 1 | 29 |
| 69 | Funk Guitar2 | 121 | 2 | 29 |
| 70 | Chorus Gt 2 | 121 | 3 | 29 |
| 71 | Overdrive Gt | 121 | 0 | 30 |
| 72 | Guitar Pinch | 121 | 1 | 30 |
| 73 | DistortionGt | 121 | 0 | 31 |
| 74 | Gt Feedback1 | 121 | 1 | 31 |
| 75 | Dist.Rhy Gt | 121 | 2 | 31 |
| 76 | Gt Harmonics | 121 | 0 | 32 |
| 77 | Gt Feedback2 | 121 | 1 | 32 |
| 78 | AcousticBass | 121 | 0 | 33 |
| 79 | FingeredBass | 121 | 0 | 34 |
| 80 | Finger Slap | 121 | 1 | 34 |
| 81 | Picked Bass | 121 | 0 | 35 |
| 82 | FretlessBass | 121 | 0 | 36 |
| 83 | Slap Bass 1 | 121 | 0 | 37 |
| 84 | Slap Bass 2 | 121 | 0 | 38 |
| 85 | Synth Bass 1 | 121 | 0 | 39 |
| 86 | WarmSyn.Bass | 121 | 1 | 39 |
| 87 | Synth Bass 3 | 121 | 2 | 39 |
| 88 | Clav.Bass | 121 | 3 | 39 |
| 89 | Hammer Bass | 121 | 4 | 39 |
| 90 | Synth Bass 2 | 121 | 0 | 40 |
| 91 | Synth Bass 4 | 121 | 1 | 40 |
| 92 | RubberSyn.Bs | 121 | 2 | 40 |
| 93 | Attack Pulse | 121 | 3 | 40 |
| 94 | Violin | 121 | 0 | 41 |
| 95 | Slow Violin | 121 | 1 | 41 |
| 96 | Viola | 121 | 0 | 42 |
| 97 | Cello | 121 | 0 | 43 |
| 98 | Contrabass | 121 | 0 | 44 |
| 99 | Tremolo Str. | 121 | 0 | 45 |
| 100 | PizzicatoStr | 121 | 0 | 46 |
| 101 | Harp | 121 | 0 | 47 |
| 102 | Yang Qin | 121 | 1 | 47 |
| 103 | Timpani | 121 | 0 | 48 |
| 104 | Strings | 121 | 0 | 49 |
| 105 | Orchestra | 121 | 1 | 49 |
| 106 | 60's Strings | 121 | 2 | 49 |
| 107 | Slow Strings | 121 | 0 | 50 |
| 108 | Syn.Strings1 | 121 | 0 | 51 |
| 109 | Syn.Strings3 | 121 | 1 | 51 |
| 110 | Syn.Strings2 | 121 | 0 | 52 |
| 111 | Choir 1 | 121 | 0 | 53 |
| 112 | Choir 2 | 121 | 1 | 53 |
| 113 | Voice | 121 | 0 | 54 |
| 114 | Humming | 121 | 1 | 54 |
| 115 | Synth Voice | 121 | 0 | 55 |
| 116 | Analog Voice | 121 | 1 | 55 |
| 117 | OrchestraHit | 121 | 0 | 56 |
| 118 | Bass Hit | 121 | 1 | 56 |
| 119 | 6th Hit | 121 | 2 | 56 |
| 120 | Euro Hit | 121 | 3 | 56 |
| 121 | Trumpet | 121 | 0 | 57 |
| 122 | Dark Trumpet | 121 | 1 | 57 |
| 123 | Trombone 1 | 121 | 0 | 58 |
| 124 | Trombone 2 | 121 | 1 | 58 |
| 125 | Bright Tb | 121 | 2 | 58 |
| 126 | Tuba | 121 | 0 | 59 |
| 127 | MuteTrumpet1 | 121 | 0 | 60 |
| 128 | MuteTrumpet2 | 121 | 1 | 60 |
| 129 | French Horn1 | 121 | 0 | 61 |
| 130 | French Horn2 | 121 | 1 | 61 |
| 131 | Brass 1 | 121 | 0 | 62 |
| 132 | Brass 2 | 121 | 1 | 62 |
| 133 | Synth Brass1 | 121 | 0 | 63 |
| 134 | Synth Brass3 | 121 | 1 | 63 |
| 135 | AnalogBrass1 | 121 | 2 | 63 |
| 136 | Jump Brass | 121 | 3 | 63 |
| 137 | Synth Brass2 | 121 | 0 | 64 |
| 138 | Synth Brass4 | 121 | 1 | 64 |
| 139 | AnalogBrass2 | 121 | 2 | 64 |
| 140 | Soprano Sax | 121 | 0 | 65 |
| 141 | Alto Sax | 121 | 0 | 66 |
| 142 | Tenor Sax | 121 | 0 | 67 |
| 143 | Baritone Sax | 121 | 0 | 68 |
| 144 | Oboe | 121 | 0 | 69 |
| 145 | English Horn | 121 | 0 | 70 |
| 146 | Bassoon | 121 | 0 | 71 |
| 147 | Clarinet | 121 | 0 | 72 |
| 148 | Piccolo | 121 | 0 | 73 |
| 149 | Flute | 121 | 0 | 74 |
| 150 | Recorder | 121 | 0 | 75 |
| 151 | Pan Flute | 121 | 0 | 76 |
| 152 | Bottle Blow | 121 | 0 | 77 |
| 153 | Shakuhachi | 121 | 0 | 78 |
| 154 | Whistle | 121 | 0 | 79 |
| 155 | Ocarina | 121 | 0 | 80 |
| 156 | Square Lead1 | 121 | 0 | 81 |
| 157 | Square Lead2 | 121 | 1 | 81 |
| 158 | Sine Lead | 121 | 2 | 81 |
| 159 | Saw Lead 1 | 121 | 0 | 82 |
| 160 | Saw Lead 2 | 121 | 1 | 82 |
| 161 | Doctor Solo | 121 | 2 | 82 |
| 162 | Natural Lead | 121 | 3 | 82 |
| 163 | SequencedSaw | 121 | 4 | 82 |
| 164 | Syn.Calliope | 121 | 0 | 83 |
| 165 | Chiffer Lead | 121 | 0 | 84 |
| 166 | Charang | 121 | 0 | 85 |
| 167 | Wire Lead | 121 | 1 | 85 |
| 168 | Solo Vox | 121 | 0 | 86 |
| 169 | 5th Saw Lead | 121 | 0 | 87 |
| 170 | Bass+Lead | 121 | 0 | 88 |
| 171 | Delayed Lead | 121 | 1 | 88 |
| 172 | Fantasia | 121 | 0 | 89 |
| 173 | Warm Pad | 121 | 0 | 90 |
| 174 | Sine Pad | 121 | 1 | 90 |
| 175 | Polysynth | 121 | 0 | 91 |
| 176 | Space Voice | 121 | 0 | 92 |
| 177 | Itopia | 121 | 1 | 92 |
| 178 | Bowed Glass | 121 | 0 | 93 |
| 179 | Metallic Pad | 121 | 0 | 94 |
| 180 | Halo Pad | 121 | 0 | 95 |
| 181 | Sweep Pad | 121 | 0 | 96 |
| 182 | Ice Rain | 121 | 0 | 97 |
| 183 | Soundtrack | 121 | 0 | 98 |
| 184 | Crystal | 121 | 0 | 99 |
| 185 | Synth Mallet | 121 | 1 | 99 |
| 186 | Atmosphere | 121 | 0 | 100 |
| 187 | Brightness | 121 | 0 | 101 |
| 188 | Goblins | 121 | 0 | 102 |
| 189 | Echo Drops | 121 | 0 | 103 |
| 190 | Echo Bell | 121 | 1 | 103 |
| 191 | Echo Pan | 121 | 2 | 103 |
| 192 | Star Theme | 121 | 0 | 104 |
| 193 | Sitar 1 | 121 | 0 | 105 |
| 194 | Sitar 2 | 121 | 1 | 105 |
| 195 | Banjo | 121 | 0 | 106 |
| 196 | Shamisen | 121 | 0 | 107 |
| 197 | Koto | 121 | 0 | 108 |
| 198 | Taisho Koto | 121 | 1 | 108 |
| 199 | Kalimba | 121 | 0 | 109 |
| 200 | Bagpipe | 121 | 0 | 110 |
| 201 | Fiddle | 121 | 0 | 111 |
| 202 | Shanai | 121 | 0 | 112 |
| 203 | Tinkle Bell | 121 | 0 | 113 |
| 204 | Agogo | 121 | 0 | 114 |
| 205 | Steel Drums | 121 | 0 | 115 |
| 206 | Woodblock | 121 | 0 | 116 |
| 207 | Castanets | 121 | 1 | 116 |
| 208 | Taiko | 121 | 0 | 117 |
| 209 | Concert BD | 121 | 1 | 117 |
| 210 | Melodic Tom1 | 121 | 0 | 118 |
| 211 | Melodic Tom2 | 121 | 1 | 118 |
| 212 | Synth Drum | 121 | 0 | 119 |
| 213 | TR-808 Tom | 121 | 1 | 119 |
| 214 | Elec.Perc. | 121 | 2 | 119 |
| 215 | Reverse Cym. | 121 | 0 | 120 |
| 216 | Gt FretNoise | 121 | 0 | 121 |
| 217 | Gt Cut Noise | 121 | 1 | 121 |
| 218 | BsStringSlap | 121 | 2 | 121 |
| 219 | Breath Noise | 121 | 0 | 122 |
| 220 | Fl.Key Click | 121 | 1 | 122 |
| 221 | Seashore | 121 | 0 | 123 |
| 222 | Rain | 121 | 1 | 123 |
| 223 | Thunder | 121 | 2 | 123 |
| 224 | Wind | 121 | 3 | 123 |
| 225 | Stream | 121 | 4 | 123 |
| 226 | Bubble | 121 | 5 | 123 |
| 227 | Bird 1 | 121 | 0 | 124 |
| 228 | Dog | 121 | 1 | 124 |
| 229 | Horse Gallop | 121 | 2 | 124 |
| 230 | Bird 2 | 121 | 3 | 124 |
| 231 | Telephone 1 | 121 | 0 | 125 |
| 232 | Telephone 2 | 121 | 1 | 125 |
| 233 | DoorCreaking | 121 | 2 | 125 |
| 234 | Door | 121 | 3 | 125 |
| 235 | Scratch | 121 | 4 | 125 |
| 236 | Wind Chimes | 121 | 5 | 125 |
| 237 | Helicopter | 121 | 0 | 126 |
| 238 | Car Engine | 121 | 1 | 126 |
| 239 | Car Stop | 121 | 2 | 126 |
| 240 | Car Pass | 121 | 3 | 126 |
| 241 | Car Crash | 121 | 4 | 126 |
| 242 | Siren | 121 | 5 | 126 |
| 243 | Train | 121 | 6 | 126 |
| 244 | Jetplane | 121 | 7 | 126 |
| 245 | Starship | 121 | 8 | 126 |
| 246 | Burst Noise | 121 | 9 | 126 |
| 247 | Applause | 121 | 0 | 127 |
| 248 | Laughing | 121 | 1 | 127 |
| 249 | Screaming | 121 | 2 | 127 |
| 250 | Punch | 121 | 3 | 127 |
| 251 | Heart Beat | 121 | 4 | 127 |
| 252 | Footsteps | 121 | 5 | 127 |
| 253 | Gun Shot | 121 | 0 | 128 |
| 254 | Machine Gun | 121 | 1 | 128 |
| 255 | Laser Gun | 121 | 2 | 128 |
| 256 | Explosion | 121 | 3 | 128 |



Digital Piano                                MIDI Implementation Chart                              Date: Aug. 1. 2021
Model：FP-30X                                                                                  Version：1.00

| Function... | Transmitted | Recognized | Remarks |
| :--- | :--- | :--- | :--- |
| **Basic Channel** | | | |
| &nbsp;&nbsp;&nbsp;&nbsp;Default | 1 | 1-16 | |
| &nbsp;&nbsp;&nbsp;&nbsp;Changed | 1-16 | 1-16 | |
| **Mode** | | | |
| &nbsp;&nbsp;&nbsp;&nbsp;Default | Mode 3 | Mode 3 | *1 |
| &nbsp;&nbsp;&nbsp;&nbsp;Messages | X | Mode 3, 4 (M = 1) | |
| &nbsp;&nbsp;&nbsp;&nbsp;Altered | \************** | | |
| **Note Number** | 15-113 | 0-127 | |
| &nbsp;&nbsp;&nbsp;&nbsp;True Voice | \************** | 0-127 | |
| **Velocity** | | | |
| &nbsp;&nbsp;&nbsp;&nbsp;Note On | O | O | |
| &nbsp;&nbsp;&nbsp;&nbsp;Note Off | O | O | |
| **After Touch** | | | |
| &nbsp;&nbsp;&nbsp;&nbsp;Key's | X | X | |
| &nbsp;&nbsp;&nbsp;&nbsp;Channel's | X | O | |
| **Pitch Bend** | X | O | |
| **Control Change** | | | |
| &nbsp;&nbsp;&nbsp;&nbsp;0, 32 | O | O | Bank select |
| &nbsp;&nbsp;&nbsp;&nbsp;1 | X | O | Modulation |
| &nbsp;&nbsp;&nbsp;&nbsp;5 | X | O | Portamento time |
| &nbsp;&nbsp;&nbsp;&nbsp;6, 38 | X | O | Data entry |
| &nbsp;&nbsp;&nbsp;&nbsp;7 | X | O | Volume |
| &nbsp;&nbsp;&nbsp;&nbsp;10 | X | O | Panpot |
| &nbsp;&nbsp;&nbsp;&nbsp;11 | X | O | Expression |
| &nbsp;&nbsp;&nbsp;&nbsp;64 | O | O | Hold 1 |
| &nbsp;&nbsp;&nbsp;&nbsp;65 | X | O | Portamento |
| &nbsp;&nbsp;&nbsp;&nbsp;66 | O | O | Sostenuto |
| &nbsp;&nbsp;&nbsp;&nbsp;67 | O | O | Soft |
| &nbsp;&nbsp;&nbsp;&nbsp;71 | X | O | Resonance |
| &nbsp;&nbsp;&nbsp;&nbsp;72 | X | O | Release time |
| &nbsp;&nbsp;&nbsp;&nbsp;73 | X | O | Attack time |
| &nbsp;&nbsp;&nbsp;&nbsp;74 | X | O | Cutoff |
| &nbsp;&nbsp;&nbsp;&nbsp;75 | X | O | Decay time |
| &nbsp;&nbsp;&nbsp;&nbsp;76 | X | O | Vibrato rate |
| &nbsp;&nbsp;&nbsp;&nbsp;77 | X | O | Vibrato depth |
| &nbsp;&nbsp;&nbsp;&nbsp;78 | X | O | Vibrato delay |
| &nbsp;&nbsp;&nbsp;&nbsp;84 | X | O | Portamento control |
| &nbsp;&nbsp;&nbsp;&nbsp;91 | O | O (Reverb) | General purpose effects 1 depth |
| &nbsp;&nbsp;&nbsp;&nbsp;93 | X | O (Chorus) | General purpose effects 3 depth |
| &nbsp;&nbsp;&nbsp;&nbsp;100, 101 | X | O | RPN LSB, MSB |
| **Program Change** | O | O | |
| &nbsp;&nbsp;&nbsp;&nbsp;True Number | \************** | 0-127 | Program No. 1-128 |
| **System Exclusive** | O | O | |
| **System Common** | | | |
| &nbsp;&nbsp;&nbsp;&nbsp;Song Position | X | X | |
| &nbsp;&nbsp;&nbsp;&nbsp;Song Select | X | X | |
| &nbsp;&nbsp;&nbsp;&nbsp;Tune Request | X | X | |
| **System Real Time** | | | |
| &nbsp;&nbsp;&nbsp;&nbsp;Clock | X | X | |
| &nbsp;&nbsp;&nbsp;&nbsp;Commands | X | X | |
| **Aux Messages** | | | |
| &nbsp;&nbsp;&nbsp;&nbsp;All Sound Off | X | O | |
| &nbsp;&nbsp;&nbsp;&nbsp;Reset All Controllers | X | O | |
| &nbsp;&nbsp;&nbsp;&nbsp;Local On/Off | O | X | |
| &nbsp;&nbsp;&nbsp;&nbsp;All Notes Off | X | O (123-127) | |
| &nbsp;&nbsp;&nbsp;&nbsp;Active Sensing | X | X | |
| &nbsp;&nbsp;&nbsp;&nbsp;System Reset | X | X | |
| **Notes** | *1 Only M=1 is supported | | |

<br>

Mode 1 : OMNI ON, POLY &nbsp;&nbsp;&nbsp;&nbsp; Mode 2 : OMNI ON, MONO<br>
Mode 3 : OMNI OFF, POLY &nbsp;&nbsp;&nbsp;&nbsp; Mode 4 : OMNI OFF, MONO<br>
O : Yes &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; X : No

