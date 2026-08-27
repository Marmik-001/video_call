import { useEffect, useRef, useCallback } from "react";

interface UseStreamMediaOptions {
  
}
interface UseStreamMediaReturn {

  stream: MediaStream | null;
  error: Error | null;
  isLoading: boolean;
  stopStreaming: () => void;
  requestPermission: () => Promise < MediaStream | null>
}

export const useStreamMedia = () => {
  
}