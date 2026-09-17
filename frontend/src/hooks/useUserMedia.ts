import { useState, useRef, useEffect, useCallback } from "react";


interface UseUserMediaOptions {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints
}

interface UseUserMediaReturn {
  stream: MediaStream | null;
  error: Error | null;
  isLoading: boolean;
  requestPermission: () => Promise<MediaStream | null>;
  stopStream: () => void
}

export const useUserMedia = (
  constraints: UseUserMediaOptions = { video: true, audio: true }
): UseUserMediaReturn => {

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const streamRef = useRef<MediaStream | null>(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, [])


  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error("media devices api not found in this browser")
      setError(err)
      setIsLoading(false)
      return null;
    }

    try {
      const userStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(userStream)
      streamRef.current = userStream
      return userStream;
    } catch (e) {
      const mediaError = e instanceof Error ? e : new Error('failed to access media devices')
      console.log("error in request permission: ", mediaError)
      setError(mediaError)
      return null
    } finally {

      setIsLoading(false);
    }

  }, [constraints])

  useEffect(() => {
    return () => {
      stopStream();
    }
  }, [stopStream])

  return { stream, error, isLoading, requestPermission, stopStream }
}
