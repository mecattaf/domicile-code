export function mapViewerPoint(imageWidth, imageHeight, box, viewport, clientX, clientY) {
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) return null;
  if (!viewport || !Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) || viewport.width <= 0 || viewport.height <= 0) return null;
  if (!box || !Number.isFinite(box.x) || !Number.isFinite(box.y) || !Number.isFinite(box.width) || !Number.isFinite(box.height) || box.width <= 0 || box.height <= 0) return null;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;

  const scale = Math.min(box.width / imageWidth, box.height / imageHeight);
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;
  const offsetX = (box.width - displayedWidth) / 2;
  const offsetY = (box.height - displayedHeight) / 2;

  const localX = clientX - box.x - offsetX;
  const localY = clientY - box.y - offsetY;

  if (localX < 0 || localX >= displayedWidth || localY < 0 || localY >= displayedHeight) return null;

  const imgX = localX / scale;
  const imgY = localY / scale;

  const targetScaleX = viewport.width / imageWidth;
  const targetScaleY = viewport.height / imageHeight;

  return {
    x: imgX * targetScaleX,
    y: imgY * targetScaleY
  };
}
