import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  audioUrl: string | null;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ audioUrl, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Fix: Initialize useRef with null to satisfy TypeScript requirements
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    // Create a new Audio element for each new URL to avoid SourceNode reuse conflicts
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    // Initialize Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Connect graph
    try {
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) {
      console.error("Audio Source creation failed:", e);
    }

    // Cleanup function: stop audio, close context
    return () => {
      audio.pause();
      audio.src = "";
      audio.load();
      if (ctx.state !== 'closed') {
        ctx.close().catch(console.error);
      }
    };
  }, [audioUrl]);


  useEffect(() => {
    if (!audioRef.current || !audioContextRef.current) return;

    if (isPlaying) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      draw();
    } else {
      audioRef.current.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyserRef.current!.getByteFrequencyData(dataArray);

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Scale down

        // Minimalist Dark Gradient
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#525252'); // Neutral 600
        gradient.addColorStop(1, '#171717'); // Neutral 900

        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        // Check if roundRect is supported, otherwise fallback to rect
        if (typeof ctx.roundRect === 'function') {
           ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
        } else {
           ctx.rect(x, canvas.height - barHeight, barWidth, barHeight);
        }
        ctx.fill();

        x += barWidth + 2;
      }
    };

    renderFrame();
  };

  return (
    <div className="w-full h-32 bg-neutral-100/50 rounded-xl overflow-hidden relative">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={128} 
        className="w-full h-full"
      />
      {!isPlaying && audioUrl && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-neutral-400 font-medium text-xs tracking-widest uppercase bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-neutral-100">
                 Paused
             </span>
         </div>
      )}
    </div>
  );
};

export default Visualizer;