import { useEffect, useState, useRef, useCallback } from "react";

interface UseUserScreenShareOptions {
  // video: {
  //   displaySurface: string;
  // };
  video: boolean  
  // audio: {
  //   suppressLocalAudioPlayback: boolean;
  // };
  // preferCurrentTab: boolean;
  // selfBrowserSurface: "exclude" | "include";
  // systemAudio: "exclude" | "include";
  // surfaceSwitching: "exclude" | "include";
  // monitorTypeSurfaces: "exclude" | "include";
}

interface UseUserScreenShareReturn {
  stream: MediaStream | null;
  isLoading: boolean;
  error: Error | null;
  requestPermission: () => Promise<MediaStream | null>;
  stopScreenSharing: () => void;
}

export const useUserScreenShare = (
  constraints?: UseUserScreenShareOptions,
): UseUserScreenShareReturn => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const stopScreenSharing = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!navigator.mediaDevices?.getDisplayMedia()) {
      const err = new Error("no media device api found in the browser");
      setError(err);
      return null
    }

    try {
      const userStream =
        await navigator.mediaDevices?.getDisplayMedia(constraints);
      userStream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };
      // console.log(userStream)
      setStream(userStream);
      streamRef.current = userStream;
      return userStream;
    } catch (e) {
      const mediaError =
        e instanceof Error ? e : new Error("failed to access media devices");
      setError(mediaError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [constraints]);

  useEffect(() => {
    return () => {
      stopScreenSharing()
    }
  }, [stopScreenSharing]);

  
  return { stopScreenSharing, stream, requestPermission, isLoading, error };
};
