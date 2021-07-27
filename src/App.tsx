import React, { createRef, useEffect, useCallback, useRef } from 'react';
import * as BlazeFaceModel from '@tensorflow-models/blazeface';

const App: React.FunctionComponent = () => {
  const videoRef = createRef<HTMLVideoElement>();
  const canvasRef = createRef<HTMLCanvasElement>();
  const model = useRef<BlazeFaceModel.BlazeFaceModel>();
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const setupCamera = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }
    const video = videoRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user' },
    });
    video.srcObject = stream;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }, [videoRef]);

  const renderPrediction = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !ctxRef.current) {
      return;
    }
    const returnTensors = false;
    const flipHorizontal = true;
    const annotateBoxes = true;
    const video = videoRef.current;
    const canvas = videoRef.current;
    const ctx = ctxRef.current;
    const predictions = await model.current!.estimateFaces(
      video,
      returnTensors,
      flipHorizontal,
      annotateBoxes,
    );

    if (predictions.length > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < predictions.length; i++) {
        if (returnTensors) {
          predictions[i].topLeft = (predictions[i].topLeft as any).arraySync();
          predictions[i].bottomRight = (predictions[i].bottomRight as any).arraySync();
          if (annotateBoxes) {
            predictions[i].landmarks = (predictions[i].landmarks as any).arraySync();
          }
        }

        const start = predictions[i].topLeft as number[];
        const end = predictions[i].bottomRight as number[];
        const size = [end[0] - start[0], end[1] - start[1]];
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(start[0], start[1], size[0], size[1]);

        if (annotateBoxes) {
          const landmarks = predictions[i].landmarks as any;

          ctx.fillStyle = 'blue';
          for (let j = 0; j < landmarks.length; j++) {
            const x = landmarks[j][0];
            const y = landmarks[j][1];
            ctx.fillRect(x, y, 5, 5);
          }
        }
      }
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(renderPrediction);
  }, [canvasRef, videoRef]);

  const setupPage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    await setupCamera();
    video.play();

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    video.width = videoWidth;
    video.height = videoHeight;

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctxRef.current = canvas.getContext('2d');
    ctxRef.current!.fillStyle = 'rgba(255, 0, 0, 0.5)';

    model.current = await BlazeFaceModel.load();

    renderPrediction();
  }, [canvasRef, renderPrediction, setupCamera, videoRef]);

  useEffect(() => {
    setupPage();
  }, [setupPage]);

  return (
    <div id="main">
      <video ref={videoRef} playsInline />
      <canvas ref={canvasRef} width="600px" height="400px" />
    </div>
  );
};

export default App;
