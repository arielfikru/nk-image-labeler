"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RootState } from "@/store";
import {
  updateLabels,
  setCurrentImageIndex,
  addLabelClass,
  renameLabelClass,
} from "@/store/imagesSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Pencil, MousePointer, Square } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface Label {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
}

interface EditClassState {
  isEditing: boolean;
  classToEdit: string;
  newClassName: string;
}

type Tool = "select" | "boundingBox";

export default function Labeling() {
  const { toast } = useToast();
  const images = useSelector((state: RootState) => state.images.images);
  const labelClasses = useSelector(
    (state: RootState) => state.images.labelClasses
  );
  const currentIndex = useSelector(
    (state: RootState) => state.images.currentImageIndex
  );
  const dispatch = useDispatch();
  const router = useRouter();

  const [currentTool, setCurrentTool] = useState<Tool>("boundingBox");
  const [boxSize, setBoxSize] = useState({ width: 50, height: 50 });
  const [boxPosition, setBoxPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [newLabelInput, setNewLabelInput] = useState("");
  const [editClass, setEditClass] = useState<EditClassState>({
    isEditing: false,
    classToEdit: "",
    newClassName: "",
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageMapRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredLabelIndex, setHoveredLabelIndex] = useState<number | null>(
    null
  );

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
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore key events when typing in input fields
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case "b":
          setCurrentTool("boundingBox");
          break;
        case "v":
          setCurrentTool("select");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
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
            width: Math.round(
              Math.max(10, Math.min(canvasSize.width, prev.width * scaleFactor))
            ),
            height: Math.round(
              Math.max(
                10,
                Math.min(canvasSize.height, prev.height * scaleFactor)
              )
            ),
          }));
        } else if (
          e.clientX >= imageMapRect.left &&
          e.clientX <= imageMapRect.right &&
          e.clientY >= imageMapRect.top &&
          e.clientY <= imageMapRect.bottom
        ) {
          return;
        } else {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [canvasSize]);

  const getColorForLabel = (labelClass: string) => {
    const colors = ["blue", "red", "green", "yellow", "purple", "orange"];
    const index = labelClasses.indexOf(labelClass) % colors.length;
    return colors[index];
  };

  const drawImageAndLabels = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && images[currentIndex]) {
      const img = new window.Image();
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate image scaling and position
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const x = canvas.width / 2 - (img.width / 2) * scale;
        const y = canvas.height / 2 - (img.height / 2) * scale;
        const width = img.width * scale;
        const height = img.height * scale;

        // Update state with image dimensions
        setImageSize({ width, height });
        setImagePosition({ x, y });

        // Draw the main image
        ctx.drawImage(img, x, y, width, height);

        // Draw all labels
        images[currentIndex].labels.forEach((label, index) => {
          // Get color for current label
          const color = getColorForLabel(label.class);

          // Draw bounding box
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x + label.x * scale,
            y + label.y * scale,
            label.width * scale,
            label.height * scale
          );

          // Draw label class text
          ctx.fillStyle = color;
          ctx.font = "12px Arial";
          ctx.textAlign = "left";
          ctx.textBaseline = "bottom";
          ctx.fillText(
            label.class,
            x + label.x * scale,
            y + label.y * scale - 5
          );

          // Draw delete button only when label is hovered and select tool is active
          if (index === hoveredLabelIndex && currentTool === "select") {
            const buttonSize = 20;
            const buttonX =
              x + (label.x + label.width) * scale - buttonSize / 2;
            const buttonY = y + label.y * scale - buttonSize / 2;

            // Draw red circle background
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(
              buttonX + buttonSize / 2,
              buttonY + buttonSize / 2,
              buttonSize / 2,
              0,
              2 * Math.PI
            );
            ctx.fill();

            // Draw white "×" symbol
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              "×",
              buttonX + buttonSize / 2,
              buttonY + buttonSize / 2
            );
          }
        });
      };
      img.src = images[currentIndex].data;
    }
  }, [currentIndex, images, hoveredLabelIndex, currentTool, getColorForLabel]);

  useEffect(() => {
    drawImageAndLabels();
  }, [drawImageAndLabels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        setIsCtrlPressed(true);
      } else if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        setIsCtrlPressed(false);
        setLastMousePosition(null);
      } else if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const getCanvasCursor = () => {
    if (currentTool === "select") {
      return hoveredLabelIndex !== null ? "pointer" : "default";
    }
    return "crosshair";
  };

  // const getColorForLabel = (labelClass: string) => {
  //   const colors = ["blue", "red", "green", "yellow", "purple", "orange"];
  //   const index = labelClasses.indexOf(labelClass) % colors.length;
  //   return colors[index];
  // };

  const handleStartEdit = (labelClass: string) => {
    setEditClass({
      isEditing: true,
      classToEdit: labelClass,
      newClassName: labelClass,
    });
  };

  const handleEndEdit = () => {
    setEditClass({
      isEditing: false,
      classToEdit: "",
      newClassName: "",
    });
  };

  const handleRenameClass = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && editClass.newClassName.trim()) {
      const newName = editClass.newClassName.trim();
      const oldName = editClass.classToEdit;

      if (labelClasses.includes(newName) && newName !== oldName) {
        toast({
          description: "This class name already exists!",
          duration: 2000,
        });
        return;
      }

      if (selectedClass === oldName) {
        setSelectedClass(newName);
      }

      dispatch(renameLabelClass({ oldName, newName }));
      handleEndEdit();
    } else if (e.key === "Escape") {
      handleEndEdit();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !images[currentIndex]) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (currentTool === "select") {
      // Logika untuk tool select
      const clickedLabelIndex = images[currentIndex].labels.findIndex(
        (label, index) => {
          if (index !== hoveredLabelIndex) return false;
          const scale = imageSize.width / images[currentIndex].width;
          const buttonSize = 20;
          const buttonX =
            imagePosition.x + (label.x + label.width) * scale - buttonSize / 2;
          const buttonY = imagePosition.y + label.y * scale - buttonSize / 2;

          return (
            clickX >= buttonX &&
            clickX <= buttonX + buttonSize &&
            clickY >= buttonY &&
            clickY <= buttonY + buttonSize
          );
        }
      );

      if (clickedLabelIndex !== -1) {
        handleLabelDelete(clickedLabelIndex);
      }
      return;
    }

    // Logika untuk tool bounding box
    if (!selectedClass) {
      toast({
        description: "Please select a label class first!",
        duration: 2000,
      });
      return;
    }

    if (
      clickX >= imagePosition.x &&
      clickX <= imagePosition.x + imageSize.width &&
      clickY >= imagePosition.y &&
      clickY <= imagePosition.y + imageSize.height
    ) {
      const scale = imageSize.width / images[currentIndex].width;
      const labelX =
        (clickX - imagePosition.x) / scale - boxSize.width / (2 * scale);
      const labelY =
        (clickY - imagePosition.y) / scale - boxSize.height / (2 * scale);
      const labelWidth = boxSize.width / scale;
      const labelHeight = boxSize.height / scale;

      const newLabel: Label = {
        x: labelX,
        y: labelY,
        width: labelWidth,
        height: labelHeight,
        class: selectedClass,
      };

      const updatedLabels = [...images[currentIndex].labels, newLabel];

      dispatch(
        updateLabels({
          imageId: images[currentIndex].id,
          labels: updatedLabels,
        })
      );

      drawImageAndLabels();

      if (!isShiftPressed) {
        if (currentIndex === images.length - 1) {
          toast({
            description: "All images have been labeled!",
            duration: 1000,
          });
        } else {
          dispatch(setCurrentImageIndex(currentIndex + 1));
        }
      }
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (!isCtrlPressed) {
          setBoxPosition({ x, y });

          const scale = imageSize.width / images[currentIndex].width;
          const hoveredIndex = images[currentIndex].labels.findIndex(
            (label) => {
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
            }
          );
          setHoveredLabelIndex(hoveredIndex !== -1 ? hoveredIndex : null);
        } else {
          if (lastMousePosition) {
            const dx = x - lastMousePosition.x;
            const dy = lastMousePosition.y - y;
            setBoxSize((prev) => ({
              width: Math.round(
                Math.max(10, Math.min(canvasSize.width, prev.width + dx))
              ),
              height: Math.round(
                Math.max(10, Math.min(canvasSize.height, prev.height + dy))
              ),
            }));
          }
          setLastMousePosition({ x, y });
        }
      }
    },
    [
      isCtrlPressed,
      lastMousePosition,
      canvasSize,
      images,
      currentIndex,
      imagePosition,
      imageSize,
    ]
  );

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
    const updatedLabels = images[currentIndex].labels.filter(
      (_, i) => i !== index
    );
    dispatch(
      updateLabels({
        imageId: images[currentIndex].id,
        labels: updatedLabels,
      })
    );

    setHoveredLabelIndex(null);
  };

  const handleClearAllLabels = () => {
    dispatch(
      updateLabels({
        imageId: images[currentIndex].id,
        labels: [],
      })
    );
    setHoveredLabelIndex(null);
  };

  const handleAddLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newLabelInput.trim()) {
      if (!labelClasses.includes(newLabelInput.trim())) {
        dispatch(addLabelClass(newLabelInput.trim()));
        setSelectedClass(newLabelInput.trim());
      }
      setNewLabelInput("");
    }
  };

  return (
    <div className="flex min-h-screen p-4">
      <div className="w-64 mr-4">
        <Button onClick={handleBackToGallery} className="w-full mb-4">
          Back to Gallery
        </Button>
        <Card
          className="sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-hidden"
          ref={imageMapRef}
        >
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
                    <div className="relative w-full h-full">
                      <Image
                        src={img.data}
                        alt={img.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
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
      <div className="w-32 mr-4">
        <Card className="p-2 sticky top-4">
          <h3 className="text-sm font-semibold mb-2 px-2">Tools</h3>
          <div className="space-y-1">
            <div
              role="button"
              onClick={() => setCurrentTool("boundingBox")}
              className={cn(
                "flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm",
                currentTool === "boundingBox"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Square className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Box (B)</div>
              </div>
            </div>

            <div
              role="button"
              onClick={() => setCurrentTool("select")}
              className={cn(
                "flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm",
                currentTool === "select"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <MousePointer className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Select (V)</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div className="flex flex-col items-center flex-grow">
        <h1 className="text-2xl font-bold mb-4">Image Labeling</h1>

        {images.length === 0 ? (
          <div className="flex justify-center items-center h-64 w-full">
            <p className="text-xl text-gray-500">
              No images available for labeling
            </p>
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
                style={{ cursor: getCanvasCursor() }}
              />
              {currentTool === "boundingBox" && boxPosition && (
                <div
                  style={{
                    position: "absolute",
                    left: boxPosition.x - boxSize.width / 2,
                    top: boxPosition.y - boxSize.height / 2,
                    width: boxSize.width,
                    height: boxSize.height,
                    border: `2px solid ${
                      selectedClass ? getColorForLabel(selectedClass) : "red"
                    }`,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
            <div className="flex space-x-4 mb-4">
              <Button
                onClick={handlePreviousImage}
                disabled={currentIndex === 0}
              >
                Previous Image
              </Button>
              <Button
                onClick={handleNextImage}
                disabled={currentIndex === images.length - 1}
              >
                Next Image
              </Button>
            </div>
            <div className="w-full max-w-2xl">
              <Card className="mb-4">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Label Classes</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {labelClasses.map((labelClass) => (
                      <div key={labelClass} className="flex items-center gap-1">
                        {editClass.isEditing &&
                        editClass.classToEdit === labelClass ? (
                          <Input
                            type="text"
                            value={editClass.newClassName}
                            onChange={(e) =>
                              setEditClass((prev) => ({
                                ...prev,
                                newClassName: e.target.value,
                              }))
                            }
                            onKeyDown={handleRenameClass}
                            onBlur={handleEndEdit}
                            className="w-32 h-8 px-2 text-sm"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant={
                                selectedClass === labelClass
                                  ? "default"
                                  : "outline"
                              }
                              className={`px-3 py-1 text-sm ${
                                selectedClass === labelClass
                                  ? "ring-2 ring-offset-2"
                                  : ""
                              }`}
                              style={{
                                backgroundColor:
                                  selectedClass === labelClass
                                    ? getColorForLabel(labelClass)
                                    : "transparent",
                                borderColor: getColorForLabel(labelClass),
                              }}
                              onClick={() => setSelectedClass(labelClass)}
                            >
                              {labelClass}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleStartEdit(labelClass)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add new label class and press Enter"
                      value={newLabelInput}
                      onChange={(e) => setNewLabelInput(e.target.value)}
                      onKeyPress={handleAddLabel}
                      className="flex-grow"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <div className="w-64 ml-4 flex flex-col h-screen">
        <Button onClick={handleFinish} className="w-full mb-4">
          Finish Labeling
        </Button>

        {/* Box Size Settings Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-4">Box Size Settings</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="box-width"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Box Width: {boxSize.width}px
                </label>
                <Slider
                  id="box-width"
                  min={10}
                  max={canvasSize.width}
                  step={1}
                  value={[boxSize.width]}
                  onValueChange={(value) =>
                    setBoxSize((prev) => ({
                      ...prev,
                      width: Math.round(value[0]),
                    }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="box-height"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Box Height: {boxSize.height}px
                </label>
                <Slider
                  id="box-height"
                  min={10}
                  max={canvasSize.height}
                  step={1}
                  value={[boxSize.height]}
                  onValueChange={(value) =>
                    setBoxSize((prev) => ({
                      ...prev,
                      height: Math.round(value[0]),
                    }))
                  }
                />
              </div>
              <p className="text-sm text-gray-600">
                Tip: Use mouse wheel over canvas to adjust box size
                proportionally.
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
                <p className="text-sm text-gray-500">
                  No labels for this image
                </p>
              ) : (
                <div className="space-y-2">
                  {images[currentIndex]?.labels.map((label, index) => {
                    const color = getColorForLabel(label.class);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded"
                        style={{
                          backgroundColor: `${color}20`,
                          borderLeft: `4px solid ${color}`,
                        }}
                        onMouseEnter={() => handleLabelHover(index)}
                        onMouseLeave={() => handleLabelHover(null)}
                      >
                        <span className="text-sm font-medium">
                          {label.class}
                        </span>
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
