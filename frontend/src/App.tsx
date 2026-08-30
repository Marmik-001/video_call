// import { Button } from "./components/ui/button";
// import { MediaStreamDemo } from "./components/media/MediaStreamDemo";
// import { ScreenShareDemo } from "./components/media/ScreenShareDemo";
// import { StreamFromOneElementToAnother } from "./components/media/StreamFromOneElementToAnother";
import { TrialWebRTC } from "./components/webRTC/TrialWebRTC";
import { Chatbox } from "./components/webRTC/Chatbox";
import { socketService } from "./services/websocket.service";
import { useEffect } from "react";
// import Event_one from "./components/events/event_one";
// import Event_two from "./components/events/event_two";
// import Event_three from "./components/events/event_three";
function App() {

  useEffect(() => {
    socketService.connect('http://localhost:8080')
    
  })

  return (
    <div className=" bg-fuchsia-800 w-screen h-screen grid grid-cols-3 grid-rows-2  ">
      {/*<MediaStreamDemo />*/}
      {/*<ScreenShareDemo />*/}
      {/*<StreamFromOneElementToAnother />*/}
      {/* <Event_one />
      <Event_two />
      <Event_three /> */}
      
      {/* <TrialWebRTC /> */}
      <Chatbox />      
    </div>
  );
}

export default App;
