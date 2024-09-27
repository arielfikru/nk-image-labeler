"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { updateLabel, setCurrentImageIndex } from "@/store/imagesSlice";
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

  const [boxSize, setBoxSize] = useState(50);
  const [boxPosition, setBoxPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageMapRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

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
          setBoxSize((prev) => {
            const newSize = prev - Math.sign(e.deltaY) * 20;
            return Math.max(10, Math.min(canvasSize.width, newSize));
          });
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
    drawImageAndLabel();
  }, [currentIndex, images, canvasSize]);

  const drawImageAndLabel = () => {
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

        const label = images[currentIndex].labels[0];
        if (label) {
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x + label.x * scale,
            y + label.y * scale,
            label.width * scale,
            label.height * scale
          );
        }
      };
      img.src = images[currentIndex].data;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas && images[currentIndex]) {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
  
      if (
        clickX >= imagePosition.x &&
        clickX <= imagePosition.x + imageSize.width &&
        clickY >= imagePosition.y &&
        clickY <= imagePosition.y + imageSize.height
      ) {
        const scale = imageSize.width / images[currentIndex].width
        const labelX = ((clickX - imagePosition.x) / scale) - (boxSize / (2 * scale))
        const labelY = ((clickY - imagePosition.y) / scale) - (boxSize / (2 * scale))
        const labelWidth = boxSize / scale
        const labelHeight = boxSize / scale
  
        const newLabel: Label = {
          x: labelX,
          y: labelY,
          width: labelWidth,
          height: labelHeight
        }
  
        dispatch(updateLabel({
          imageId: images[currentIndex].id,
          label: newLabel
        }))
  
        drawImageAndLabel()
  
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
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setBoxPosition({ x, y });
    }
  };

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
                    left: boxPosition.x - boxSize / 2,
                    top: boxPosition.y - boxSize / 2,
                    width: boxSize,
                    height: boxSize,
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
      <div className="w-64 ml-4">
        <Button onClick={handleFinish} className="w-full mb-4">Finish Labeling</Button>
        <Card className="sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-hidden">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-4">Box Size Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="box-size" className="block text-sm font-medium text-gray-700 mb-1">
                  Box Size: {boxSize}px
                </label>
                <Slider
                  id="box-size"
                  min={10}
                  max={canvasSize.width}
                  step={1}
                  value={[boxSize]}
                  onValueChange={(value) => setBoxSize(value[0])}
                />
              </div>
              <p className="text-sm text-gray-600">
                Tip: You can use the mouse wheel over the canvas to adjust the box size.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}