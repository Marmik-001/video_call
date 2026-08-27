import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useWebRTCConnection } from "@/api/webRTC";
import type { Msg } from "@/api/webRTC";
export const TrialWebRTC: React.FC = () => {
  const {
    addRemoteDescription,
    addRemoteIceCandidatesFromList,
    connectionRef,
    createAnswer,
    error,
    iceCandidates,
    initializerPeer,
    isLoading,
    msg,
    receiverPeer,
    sendMsg,
    getLocalDescription,
  } = useWebRTCConnection();

  const [localdesc, setLocalDesc] =
    useState<RTCLocalSessionDescriptionInit | null>(null);
  const [remoteDesc, setRemoteDesc] =
    useState<RTCSessionDescriptionInit | null>(null);
  const [iceCandiInput , setIceCandiInput] = useState("")
  const [remoteIceCandis, setRemoteIceCandis] = useState<RTCIceCandidateInit[]>([])
  const [sender, setSender] = useState(true);

  return (
    <div className="h-screen col-span-3 w-screen flex flex-col gap-3">
      <Button
        onClick={() => {
          setSender((prevSender) => !prevSender);
        }}
      >
        {sender ? "initiator mode" : "receiver mode"}
      </Button>

      {sender ? (
        <div className="flex flex-col gap-3  border-2 p-4 w-4xl ">
          {/* <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="bg-black text-white size-10 flex-4 rounded-xl p-2 pl-4"
        /> */}
          <div className="flex flex-row gap-x-8">
            <Button
              className="flex-1 p-2 size-10"
              onClick={async () => {
                initializerPeer();
                const ld = await getLocalDescription();
                if (ld && ld?.type === "offer") {
                  setLocalDesc(ld);
                } else {
                  return;
                }
              }}
            >
              initiate messaging!!!
            </Button>
            <p className="flex-5 truncate">{JSON.stringify(localdesc)}</p>
            <Button
              onClick={() => {
                if (!navigator?.clipboard) {
                  window.alert("clipbiard not supported");
                  return;
                }
                navigator.clipboard.writeText(JSON.stringify(localdesc));
                window.alert("copied to clipboard");
              }}
            >
              {" "}
              copy offer{" "}
            </Button>
          </div>

          {/*  local ice candidates  */}
          <div className=" flex flex-row gap-3">
            <div className="flex flex-col gap-3">
              {!iceCandidates ? (
                <p>waiting for getting local ice candidates </p>
              ) : (
                <div>
                  {iceCandidates.map((element, index) => (
                    <div>
                      <li key={`${element.candidate ?? index}`}>
                        {element.candidate}
                      </li>
                      <Button
                        onClick={() => {
                          if (!navigator?.clipboard) {
                            window.alert("clipbiard not supported");
                            return;
                          }
                          navigator.clipboard.writeText(
                            JSON.stringify(element.candidate),
                          );
                          window.alert("copied to clipboard");
                        }}
                      >
                        Copy candidate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div>
            <input
              value={JSON.stringify(remoteDesc)}
              onChange={(e) => {
                const rmDesc = e.target.value;
                setRemoteDesc(JSON.parse(rmDesc));
              }}
              className="border-2 border-grey-600 rounded-md p-2 size 10"
            />

            <Button
              className="bg-red-400 size-10 p-2 w-auto py-6 ml-3"
                onClick={() => {
                  if (remoteDesc) {
                    receiverPeer(remoteDesc);
                  }
              }}
            >
              handle Receiving connection
            </Button>
          </div>
            <div>
              <input value={iceCandiInput} onChange={(e) => {
                setIceCandiInput(e.target.value)
              }}
              placeholder="enter ice candidates"
              className="border-2 rounded-md mt-2 size-10 p-2 w-auto placeholder:text-blue-100"
              />
              <Button onClick={() => {
                setRemoteIceCandis(prevIceCandis => [...prevIceCandis, JSON.parse(iceCandiInput)])
                setIceCandiInput("")
              }
              }
                className="size-10 w-auto p-4 ml-4">add remote ice candidate </Button>

          </div>
            <Button onClick={() => {
              createAnswer()
              }}>Create Answer </Button>
        </div>
      )}
    </div>
  );
};
