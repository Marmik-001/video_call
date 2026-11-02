import Layout from "./components/webRTC/Layout";
import { socketService } from "./services/websocket.service";
import { getSignalingUrl } from "./utils/websocket.utils";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const url = getSignalingUrl();
    socketService.connect(url);

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className=" bg-fuchsia-800 w-full h-full grid grid-cols-3 grid-rows-2  ">
      <Layout />
    </div>
  );
}

export default App;
