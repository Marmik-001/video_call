export interface SyntheticMediaResult {
  stream: MediaStream;
  stop: () => void;
}

/**
 * Creates an animated synthetic video MediaStream using HTMLCanvasElement.captureStream().
 * Used as automatic fallback when physical webcam is not available or permissions are denied.
 */
export function createSyntheticMediaStream(
  width = 320,
  height = 240,
  label = "Synthetic Camera Feed"
): SyntheticMediaResult {
  if (typeof document === "undefined") {
    throw new Error("createSyntheticMediaStream requires a browser DOM environment");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  let frame = 0;
  let animId: number;

  const draw = () => {
    if (!ctx) return;
    frame++;

    // Background fill
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = "#171717";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Animated pulsing circle
    const radius = 20 + (Math.sin(frame * 0.08) + 1) * 12;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 15, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = "#34d399";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 15, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label text
    ctx.fillStyle = "#ededed";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, width / 2, height / 2 + 45);

    ctx.fillStyle = "#a1a1a1";
    ctx.font = "11px monospace";
    ctx.fillText(`Frame ${frame} • 30 FPS • Synthetic SRTP`, width / 2, height / 2 + 65);

    if (typeof requestAnimationFrame !== "undefined") {
      animId = requestAnimationFrame(draw);
    }
  };

  draw();

  const stream = typeof canvas.captureStream === "function"
    ? canvas.captureStream(30)
    : new MediaStream();

  const stop = () => {
    if (typeof cancelAnimationFrame !== "undefined" && animId) {
      cancelAnimationFrame(animId);
    }
    stream.getTracks().forEach((track) => track.stop());
  };

  return { stream, stop };
}
