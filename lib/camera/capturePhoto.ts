export function isCameraSupported(): boolean {
  return !!(
    typeof navigator !== "undefined" &&
    navigator.mediaDevices?.getUserMedia
  );
}

export async function openCameraStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  });
}

export function stopCameraStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function attachStreamToVideo(
  video: HTMLVideoElement,
  stream: MediaStream,
): Promise<void> {
  video.srcObject = stream;
  video.setAttribute("playsinline", "true");

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    await video.play();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup();
      void video.play().then(resolve).catch(reject);
    };
    const onError = () => {
      cleanup();
      reject(new Error("Video failed to load"));
    };
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("loadedmetadata", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

export function captureVideoFrame(video: HTMLVideoElement): Promise<File> {
  const { videoWidth, videoHeight } = video;
  if (!videoWidth || !videoHeight) {
    return Promise.reject(new Error("Camera not ready"));
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Canvas not supported"));
  }

  ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Capture failed"));
          return;
        }
        resolve(
          new File([blob], `receipt-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }),
        );
      },
      "image/jpeg",
      0.92,
    );
  });
}

export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "需要相机权限才能拍小票，请在浏览器设置中允许访问相机";
    }
    if (error.name === "NotFoundError") {
      return "未检测到可用相机";
    }
    if (error.name === "NotReadableError") {
      return "相机正在被其他应用占用";
    }
    if (error.name === "AbortError") {
      return "无法打开相机，请重试";
    }
  }
  return "无法打开相机，请重试";
}
