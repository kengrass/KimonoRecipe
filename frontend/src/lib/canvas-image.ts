/** Canvas / Image 読み込みの共有ヘルパ（クロップ・合成用） */

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // blob/data・同一オリジン相対パスは Cookie 付きで読めればよく、
    // crossOrigin=anonymous だと CORS ヘッダ無しの /media が落ちる。
    if (src.startsWith("http://") || src.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export function canvasToObjectUrl(
  canvas: HTMLCanvasElement,
  quality = 0.92,
): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("toBlob failed"));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      quality,
    );
  });
}
