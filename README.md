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

- getSenders gives us sender for each track, each sender has transport info using .transport 
- then there is ice transport in it  , selected pair gives us two local and remote ice candidates info, all protocols, port foundation, candidate raw string
- find a method to parse or reuse the parsing mechanism created in the ice candidate service 
- show the user, how they are connected, local IP or public IP or TURN 
- by default it will be local



-- after this is done, try to give user options to select how they want to connect
