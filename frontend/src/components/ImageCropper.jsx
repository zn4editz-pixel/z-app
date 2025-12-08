import { useState, useRef, useEffect } from "react";
import { X, Check, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

const ImageCropper = ({ image, onCrop, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    drawImage();
  }, [image, crop, zoom, rotation]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    if (!img || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom and position
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2 + crop.x, -canvas.height / 2 + crop.y);

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Restore context state
    ctx.restore();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setCrop({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - crop.x, y: touch.clientY - crop.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setCrop({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const croppedImage = canvas.toDataURL("image/jpeg", 0.9);
    onCrop(croppedImage);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="bg-base-100 p-4 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="btn btn-ghost btn-circle"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold">Crop Image</h3>
        <button
          onClick={handleCrop}
          className="btn btn-primary btn-circle"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="max-w-full max-h-full border-2 border-primary rounded-lg cursor-move touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
          <img
            ref={imageRef}
            src={image}
            alt="Crop"
            className="hidden"
            onLoad={drawImage}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-base-100 p-4 space-y-4">
        {/* Zoom */}
        <div className="flex items-center gap-3">
          <ZoomOut className="w-5 h-5 text-base-content/60" />
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="range range-primary flex-1"
          />
          <ZoomIn className="w-5 h-5 text-base-content/60" />
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-3">
          <RotateCw className="w-5 h-5 text-base-content/60" />
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="range range-primary flex-1"
          />
          <span className="text-sm text-base-content/60 min-w-[40px]">{rotation}°</span>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
          }}
          className="btn btn-outline btn-sm w-full"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
