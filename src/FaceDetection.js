import React, { useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      startVideo();
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          videoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error("Error accessing webcam: ", err);
          alert("Error accessing webcam. Please ensure your webcam is connected and you have granted access.");
        });
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('play', async () => {
        const canvas = faceapi.createCanvasFromMedia(videoRef.current);
        canvasRef.current.append(canvas);
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          if (resizedDetections.length > 0) {
            const landmarks = resizedDetections[0].landmarks;
            const mouth = landmarks.getMouth();
            drawMouth(mouth, canvas);
          }
        }, 100);
      });
    }

    loadModels();
  }, []);

  const drawMouth = (mouth, canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'green';
    ctx.beginPath();
    mouth.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.fill();
  };

  return (
    <div>
      <video ref={videoRef} width="720" height="560" autoPlay muted />
      <div ref={canvasRef} />
    </div>
  );
};

export default FaceDetection;
