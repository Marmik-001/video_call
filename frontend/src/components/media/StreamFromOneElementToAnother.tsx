import type React from "react"
import { useRef } from "react"

export const StreamFromOneElementToAnother : React.FC = ()  => {

  const elementVidRef = useRef <HTMLVideoElement | null>(null)

  return (

    <div>
      hello from stream one element to another 

      <video playsInline autoPlay muted ref={elementVidRef}/>
    </div>
  )
}

