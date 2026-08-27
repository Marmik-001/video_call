import React, { useEffect, useRef } from "react";
import { useUserMedia } from "@/hooks/useUserMedia";
import { Button } from "../ui/button";

export const MediaStreamDemo: React.FC = () => {
  const { error, isLoading, requestPermission, stopStream, stream } =
    useUserMedia({
      audio: true,
      video: true,
    });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-2xl h-1/2 flex flex-col justify-center items-center  border-blue-100 border-2 bg-fuchsia-400 ">
      <h2 className="text-2xl">camera and microphone</h2>
      {/* start/stop streaming */}
      {!stream ? (
        <Button onClick={requestPermission} disabled={isLoading}>
          {isLoading
            ? "Getting permission..."
            : "Grant Camera and Mircophone access"}
        </Button>
      ) : (
        <Button onClick={stopStream}>Stop Streaming</Button>
      )}
      {/* Error handling */}
      {error && (
        <p className="text-red-500 mt-1">
          Error :{" "}
          {error.name === "NotAllowedError"
            ? "permission Denied by User"
            : error.message}
        </p>
      )}

      {/* stream preview*/}
      {stream && (
        <div className="flex-1/2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-2xl h-3/5"
          />
        </div>
      )}
    </div>
  );
};
