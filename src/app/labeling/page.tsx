"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { updateLabels, setCurrentImageIndex } from "@/store/imagesSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast"

interface Label {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Labeling() {
  const { toast } = useToast()
  const images = useSelector((state: RootState) => state.images.images);
  const currentIndex = useSelector(
    (state: RootState) => state.images.currentImageIndex
  );
  const dispatch = useDispatch();
  const router = useRouter();

  const [boxSize, setBoxSize] = useState({ width: 50, height: 50 });
  const [boxPosition, setBoxPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageMapRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number, y: number } | null>(null);
  const [hoveredLabelIndex, setHoveredLabelIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(
        window.innerWidth - 600,
        window.innerHeight - 200,
        600
      );
      setCanvasSize({ width: size, height: size });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const canvas = canvasRef.current;
      const imageMap = imageMapRef.current;
  
      if (canvas && imageMap) {
        const canvasRect = canvas.getBoundingClientRect();
        const imageMapRect = imageMap.getBoundingClientRect();
  
        if (
          e.clientX >= canvasRect.left &&
          e.clientX <= canvasRect.right &&
          e.clientY >= canvasRect.top &&
          e.clientY <= canvasRect.bottom
        ) {
          e.preventDefault();
          const scaleFactor = 1 - Math.sign(e.deltaY) * 0.1;
          setBoxSize((prev) => ({
            width: Math.round(Math.max(10, Math.min(canvasSize.width, prev.width * scaleFactor))),
            height: Math.round(Math.max(10, Math.min(canvasSize.height, prev.height * scaleFactor))),
          }));
        }
        else if (
          e.clientX >= imageMapRect.left &&
          e.clientX <= imageMapRect.right &&
          e.clientY >= imageMapRect.top &&
          e.clientY <= imageMapRect.bottom
        ) {
          return;
        }
        else {
          e.preventDefault();
        }
      }
    };
  
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [canvasSize]);

  useEffect(() => {
    drawImageAndLabels();
  }, [currentIndex, images, canvasSize, hoveredLabelIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true);
      } else if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false);
        setLastMousePosition(null);
      } else if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const drawImageAndLabels = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && images[currentIndex]) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const x = canvas.width / 2 - (img.width / 2) * scale;
        const y = canvas.height / 2 - (img.height / 2) * scale;
        const width = img.width * scale;
        const height = img.height * scale;

        setImageSize({ width, height });
        setImagePosition({ x, y });

        ctx.drawImage(img, x, y, width, height);

        images[currentIndex].labels.forEach((label, index) => {
          const color = getColorForLabel(index);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x + label.x * scale,
            y + label.y * scale,
            label.width * scale,
            label.height * scale
          );

          if (index === hoveredLabelIndex) {
            // Draw delete button
            const buttonSize = 20;
            const buttonX = x + (label.x + label.width) * scale - buttonSize / 2;
            const buttonY = y + label.y * scale - buttonSize / 2;
            
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(buttonX + buttonSize / 2, buttonY + buttonSize / 2, buttonSize / 2, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('×', buttonX + buttonSize / 2, buttonY + buttonSize / 2);
          }
        });
      };
      img.src = images[currentIndex].data;
    }
  };

  const getColorForLabel = (index: number) => {
    const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];
    return colors[index % colors.length];
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas && images[currentIndex]) {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
  
      // Check if delete button is clicked
      const clickedLabelIndex = images[currentIndex].labels.findIndex((label, index) => {
        if (index !== hoveredLabelIndex) return false;
        const scale = imageSize.width / images[currentIndex].width;
        const buttonSize = 20;
        const buttonX = imagePosition.x + (label.x + label.width) * scale - buttonSize / 2;
        const buttonY = imagePosition.y + label.y * scale - buttonSize / 2;
        
        return (
          clickX >= buttonX &&
          clickX <= buttonX + buttonSize &&
          clickY >= buttonY &&
          clickY <= buttonY + buttonSize
        );
      });

      if (clickedLabelIndex !== -1) {
        handleLabelDelete(clickedLabelIndex);
        return;
      }
  
      if (
        clickX >= imagePosition.x &&
        clickX <= imagePosition.x + imageSize.width &&
        clickY >= imagePosition.y &&
        clickY <= imagePosition.y + imageSize.height
      ) {
        const scale = imageSize.width / images[currentIndex].width
        const labelX = ((clickX - imagePosition.x) / scale) - (boxSize.width / (2 * scale))
        const labelY = ((clickY - imagePosition.y) / scale) - (boxSize.height / (2 * scale))
        const labelWidth = boxSize.width / scale
        const labelHeight = boxSize.height / scale
  
        const newLabel: Label = {
          x: labelX,
          y: labelY,
          width: labelWidth,
          height: labelHeight
        }
  
        const updatedLabels = [...images[currentIndex].labels, newLabel];
  
        dispatch(updateLabels({
          imageId: images[currentIndex].id,
          labels: updatedLabels
        }))
  
        drawImageAndLabels()
  
        if (!isShiftPressed) {
          if (currentIndex === images.length - 1) {
            toast({
              description: "Semua image sudah dilabel!",
              duration: 1000,
            })
          } else {
            dispatch(setCurrentImageIndex(currentIndex + 1))
          }
        }
      }
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!isCtrlPressed) {
        setBoxPosition({ x, y });

        // Check if mouse is over a label
        const scale = imageSize.width / images[currentIndex].width;
        const hoveredIndex = images[currentIndex].labels.findIndex((label) => {
          const labelX = imagePosition.x + label.x * scale;
          const labelY = imagePosition.y + label.y * scale;
          const labelWidth = label.width * scale;
          const labelHeight = label.height * scale;
          return (
            x >= labelX &&
            x <= labelX + labelWidth &&
            y >= labelY &&
            y <= labelY + labelHeight
          );
        });
        setHoveredLabelIndex(hoveredIndex !== -1 ? hoveredIndex : null);
      } else {
        if (lastMousePosition) {
          const dx = x - lastMousePosition.x;
          const dy = lastMousePosition.y - y; // Inverting the y-axis
          setBoxSize((prev) => ({
            width: Math.round(Math.max(10, Math.min(canvasSize.width, prev.width + dx))),
            height: Math.round(Math.max(10, Math.min(canvasSize.height, prev.height + dy))),
          }));
        }
        setLastMousePosition({ x, y });
      }
    }
  }, [isCtrlPressed, lastMousePosition, canvasSize, images, currentIndex, imagePosition, imageSize]);

  const handleImageSelect = (index: number) => {
    dispatch(setCurrentImageIndex(index));
  };

  const handlePreviousImage = () => {
    if (currentIndex > 0) {
      dispatch(setCurrentImageIndex(currentIndex - 1));
    }
  };

  const handleNextImage = () => {
    if (currentIndex < images.length - 1) {
      dispatch(setCurrentImageIndex(currentIndex + 1));
    }
  };

  const handleFinish = () => {
    router.push("/export");
  };

  const handleBackToGallery = () => {
    router.push("/gallery");
  };

  const handleLabelHover = (index: number | null) => {
    setHoveredLabelIndex(index);
  };

  const handleLabelDelete = (index: number) => {
    const updatedLabels = images[currentIndex].labels.filter((_, i) => i !== index);
    dispatch(updateLabels({
      imageId: images[currentIndex].id,
      labels: updatedLabels
    }));
    setHoveredLabelIndex(null);
  };

  const handleClearAllLabels = () => {
    dispatch(updateLabels({
      imageId: images[currentIndex].id,
      labels: []
    }));
    setHoveredLabelIndex(null);
  };

  return (
    <div className="flex min-h-screen p-4">
      <div className="w-64 mr-4">
        <Button onClick={handleBackToGallery} className="w-full mb-4">Back to Gallery</Button>
        <Card className="sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-hidden" ref={imageMapRef}>
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-4">Images</h2>
            <ScrollArea className="h-[calc(100vh-14rem)]">
              <div className="grid grid-cols-2 gap-2">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className={`cursor-pointer relative aspect-square ${
                      index === currentIndex ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => handleImageSelect(index)}
                  >
                    <img
                      src={img.data}
                      alt={img.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {img.labels.length > 0 && (
                      <div className="absolute inset-0 border-2 border-green-500 pointer-events-none" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs truncate">
                      {img.name}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col items-center flex-grow">
        <h1 className="text-2xl font-bold mb-4">Image Labeling</h1>
        {images.length === 0 ? (
          <div className="flex justify-center items-center h-64 w-full">
            <p className="text-xl text-gray-500">No images available for labeling</p>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                className="border border-gray-300"
              />
              {boxPosition && (
                <div
                  style={{
                    position: "absolute",
                    left: boxPosition.x - boxSize.width / 2,
                    top: boxPosition.y - boxSize.height / 2,
                    width: boxSize.width,
                    height: boxSize.height,
                    border: "2px solid red",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
            <div className="flex space-x-4">
              <Button onClick={handlePreviousImage} disabled={currentIndex === 0}>Previous Image</Button>
              <Button onClick={handleNextImage} disabled={currentIndex === images.length - 1}>Next Image</Button>
            </div>
          </>
        )}
      </div>
      <div className="w-64 ml-4 flex flex-col h-screen">
        <Button onClick={handleFinish} className="w-full mb-4">Finish Labeling</Button>
        
        {/* Box Size Settings Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-4">Box Size Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="box-width" className="block text-sm font-medium text-gray-700 mb-1">
                  Box Width: {boxSize.width}px
                </label>
                <Slider
                  id="box-width"
                  min={10}
                  max={canvasSize.width}
                  step={1}
                  value={[boxSize.width]}
                  onValueChange={(value) => setBoxSize((prev) => ({ ...prev, width: Math.round(value[0]) }))}
                />
              </div>
              <div>
                <label htmlFor="box-height" className="block text-sm font-medium text-gray-700 mb-1">
                  Box Height: {boxSize.height}px
                </label>
                <Slider
                  id="box-height"
                  min={10}
                  max={canvasSize.height}
                  step={1}
                  value={[boxSize.height]}
                  onValueChange={(value) => setBoxSize((prev) => ({ ...prev, height: Math.round(value[0]) }))}
                />
              </div>
              <p className="text-sm text-gray-600">
                Tip: Use mouse wheel over canvas to adjust box size proportionally.
              </p>
              <p className="text-sm text-gray-600">
                Hold CTRL and move mouse to resize width and height separately.
              </p>
              <p className="text-sm text-gray-600">
                Hold SHIFT while clicking to add multiple labels to an image.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bounding Boxes Card */}
        <Card className="flex-grow overflow-hidden flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Bounding Boxes</h2>
            <div className="flex-grow overflow-y-auto">
              {images[currentIndex]?.labels.length === 0 ? (
                <p className="text-sm text-gray-500">No labels for this image</p>
              ) : (
                <div className="space-y-2">
                  {images[currentIndex]?.labels.map((label, index) => {
                    const color = getColorForLabel(index);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded"
                        style={{ 
                          backgroundColor: `${color}40`,
                        }}
                        onMouseEnter={() => handleLabelHover(index)}
                        onMouseLeave={() => handleLabelHover(null)}
                      >
                        <span style={{ color: 'black' }}>Label {index + 1}</span>
                        {hoveredLabelIndex === index && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleLabelDelete(index)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {images[currentIndex]?.labels.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleClearAllLabels}
              >
                Clear All Labels
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}