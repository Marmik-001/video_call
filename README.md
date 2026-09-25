# video_call
webRTC implementation

current working stage: two peers can connect and have video call with each other

todo: 

getConnectionStats function in webrtc service page 
    in this function determine what type of ice candidates are selected for conenction between two peers 


second todo list: 
refactor [frontend done] 
cleaner services 

third todo: 
first steps toward the project [stats service in progress]
.. 



NOTES FOR NEXT SESSION 

- candidate pair info is now shown in the UI
- getStats function is still very large, outboundrtp inboundrtp stats, these are remaining to display 
- just a switch case, interface, parsing, and returning to the component
- look into calculating of stats (a whole framework/service is to be created)

-- after this is done, try to give user options to select how they want to connect
