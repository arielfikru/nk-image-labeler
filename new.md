## src\src\app\favicon.ico
(Binary or unreadable file)

## src\src\app\globals.css
```
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## src\src\app\layout.tsx
```
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Image Labeling App',
  description: 'An app for labeling images',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}```

## src\src\app\page.tsx
```
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h2 className="text-xl font-bold">Dev by NekoFi</h2>
      <h1 className="text-4xl font-bold mb-8">NK Simple Image Annotator</h1>
      <Link href="/import">
        <Button>Start Labeling</Button>
      </Link>
    </main>
  )
}```

## src\src\app\export\page.tsx
```
'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from 'next/link'
import JSZip from 'jszip'
import { FixedSizeGrid as Grid } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { useRouter } from "next/navigation";

type ExportFormat = 'image' | 'coco' | 'yolo'
type DownloadType = 'zip' | 'individual'
type ImageFormat = 'png' | 'jpg80' | 'jpg100' | 'webp'
type DownloadFormat = 'full' | 'crop'

interface Label {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageData {
  id: string;
  name: string;
  data: string;
  width: number;
  height: number;
  labels: Label[];
}

export default function LabeledGallery() {
  const router = useRouter();
  const images = useSelector((state: RootState) => state.images.images)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('image')
  const [downloadType, setDownloadType] = useState<DownloadType>('zip')
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png')
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('full')
  const [label, setLabel] = useState<string>('')
  const [renderedImages, setRenderedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const renderImages = async () => {
      const rendered = await Promise.all(images.map(renderImage))
      setRenderedImages(rendered)
      setLoading(false)
    }
    renderImages()
  }, [images])

  const renderImage = (img: ImageData): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const image = new Image()
      image.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        if (ctx) {
          ctx.drawImage(image, 0, 0)
        
          img.labels.forEach(label => {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.2)' // Semi-transparent blue
            ctx.fillRect(label.x, label.y, label.width, label.height)
            ctx.strokeStyle = 'blue'
            ctx.lineWidth = 2
            ctx.strokeRect(label.x, label.y, label.width, label.height)
          })
        }
        resolve(canvas.toDataURL())
      }
      image.src = img.data
    })
  }

  const getImageDataUrl = (canvas: HTMLCanvasElement, format: ImageFormat): string => {
    switch (format) {
      case 'jpg80':
        return canvas.toDataURL('image/jpeg', 0.8)
      case 'jpg100':
        return canvas.toDataURL('image/jpeg', 1)
      case 'webp':
        return canvas.toDataURL('image/webp')
      default:
        return canvas.toDataURL('image/png')
    }
  }

  const generateCOCOData = (images: ImageData[]): string => {
    const cocoData = {
      images: images.map((img, index) => ({
        id: index,
        file_name: img.name,
        width: img.width,
        height: img.height
      })),
      annotations: images.flatMap((img, imgIndex) => 
        img.labels.map((label, labelIndex) => ({
          id: imgIndex * 1000 + labelIndex,
          image_id: imgIndex,
          category_id: 1,
          bbox: [label.x, label.y, label.width, label.height],
          area: label.width * label.height,
          iscrowd: 0
        }))
      ),
      categories: [{ id: 1, name: label, supercategory: "none" }]
    }
    return JSON.stringify(cocoData, null, 2)
  }

  const generateYOLOData = (img: ImageData): string => {
    return img.labels.map(label => {
      const centerX = (label.x + label.width / 2) / img.width
      const centerY = (label.y + label.height / 2) / img.height
      const width = label.width / img.width
      const height = label.height / img.height
      return `0 ${centerX} ${centerY} ${width} ${height}`
    }).join('\n')
  }

  const handleDownload = async () => {
    const zip = new JSZip()

    if (exportFormat === 'image') {
      await Promise.all(images.map(async (img, imgIndex) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const image = new Image()
        await new Promise<void>((resolve) => {
          image.onload = () => resolve()
          image.src = img.data
        })
        
        if (downloadFormat === 'full') {
          canvas.width = img.width
          canvas.height = img.height
          if (ctx) {
            ctx.drawImage(image, 0, 0)
          
            img.labels.forEach(label => {
              ctx.fillStyle = 'rgba(0, 0, 255, 0.2)' // Semi-transparent blue
              ctx.fillRect(label.x, label.y, label.width, label.height)
              ctx.strokeStyle = 'blue'
              ctx.lineWidth = 2
              ctx.strokeRect(label.x, label.y, label.width, label.height)
            })
          }

          const dataUrl = getImageDataUrl(canvas, imageFormat)
          zip.file(`${img.name.split('.')[0]}_labeled.${imageFormat}`, dataUrl.split(',')[1], {base64: true})
        } else { // crop
          img.labels.forEach((label, labelIndex) => {
            canvas.width = label.width
            canvas.height = label.height
            if (ctx) {
              ctx.drawImage(image, label.x, label.y, label.width, label.height, 0, 0, label.width, label.height)
            }
            const dataUrl = getImageDataUrl(canvas, imageFormat)
            zip.file(`${img.name.split('.')[0]}_crop_${labelIndex + 1}.${imageFormat}`, dataUrl.split(',')[1], {base64: true})
          })
        }
      }))
    } else if (exportFormat === 'coco') {
      const cocoData = generateCOCOData(images)
      zip.file('annotations.json', cocoData)
      images.forEach((img, index) => {
        zip.file(`images/${img.name}`, img.data.split(',')[1], {base64: true})
      })
    } else if (exportFormat === 'yolo') {
      images.forEach((img, index) => {
        const yoloData = generateYOLOData(img)
        zip.file(`labels/${img.name.split('.')[0]}.txt`, yoloData)
        zip.file(`images/${img.name}`, img.data.split(',')[1], {base64: true})
      })
    }

    if (downloadType === 'zip' || exportFormat !== 'image') {
      const content = await zip.generateAsync({type: 'blob'})
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      link.download = `labeled_data.zip`
      link.click()
    } else {
      // For individual image download
      Object.values(zip.files).forEach(async (file) => {
        const blob = await file.async('blob')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = file.name
        link.click()
      })
    }
  }

  const ImageCell = ({ columnIndex, rowIndex, style }: { columnIndex: number, rowIndex: number, style: React.CSSProperties }) => {
    const index = rowIndex * 3 + columnIndex
    if (index >= renderedImages.length) return null
    
    return (
      <div style={{
        ...style,
        left: `${parseFloat(style.left as string) + 8}px`,
        top: `${parseFloat(style.top as string) + 8}px`,
        width: `${parseFloat(style.width as string) - 16}px`,
        height: `${parseFloat(style.height as string) - 16}px`,
      }}>
        <Card className="w-full h-full flex flex-col overflow-hidden">
          <div className="flex-grow relative p-2">
            <img src={renderedImages[index]} alt={images[index].name} className="absolute inset-0 w-full h-full object-contain" />
          </div>
          <p className="p-2 text-sm truncate">{images[index].name}</p>
        </Card>
      </div>
    )
  }

  const handleBack= () => {
    router.push("/labeling");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <Button onClick={handleBack} className="mr-4">Back</Button>
        <h1 className="text-2xl font-bold">Export Image</h1>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-3/4 pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl">Loading Images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl">No images available for export</p>
            </div>
          ) : (
            <div style={{ height: 'calc(100vh - 200px)' }}>
              <AutoSizer>
                {({ height, width }) => (
                  <Grid
                    columnCount={3}
                    columnWidth={width / 3.1}
                    height={height}
                    rowCount={Math.ceil(renderedImages.length / 3)}
                    rowHeight={width / 3}
                    width={width}
                  >
                    {ImageCell}
                  </Grid>
                )}
              </AutoSizer>
            </div>
          )}
        </div>
        <div className="md:w-1/4 mt-4 md:mt-0">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Export Settings</h2>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="exportFormat">Export Format:</label>
                <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="coco">COCO</SelectItem>
                    <SelectItem value="yolo">YOLO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {exportFormat === 'image' && (
                <>
                  <div className="flex flex-col space-y-2">
                    <label htmlFor="imageFormat">Image Format:</label>
                    <Select value={imageFormat} onValueChange={(value: ImageFormat) => setImageFormat(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select image format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpg80">JPG 80%</SelectItem>
                        <SelectItem value="jpg100">JPG 100%</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="downloadFormat" 
                      checked={downloadFormat === 'crop'}
                      onCheckedChange={(checked) => setDownloadFormat(checked ? 'crop' : 'full')}
                    />
                    <label htmlFor="downloadFormat">Download crops only</label>
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="downloadType" 
                  checked={downloadType === 'zip'}
                  onCheckedChange={(checked) => setDownloadType(checked ? 'zip' : 'individual')}
                />
                <label htmlFor="downloadType">Download as ZIP</label>
              </div>
              {(exportFormat === 'coco' || exportFormat === 'yolo') && (
                <div className="flex flex-col space-y-2">
                  <label htmlFor="label">Label:</label>
                  <Input 
                    id="label" 
                    value={label} 
                    onChange={(e) => setLabel(e.target.value)} 
                    placeholder="Enter label for COCO/YOLO"
                  />
                </div>
              )}
              <Button 
                onClick={handleDownload} 
                className="w-full" 
                disabled={(exportFormat === 'coco' || exportFormat === 'yolo') && !label}
              >
                Download
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}```

## src\src\app\fonts\GeistMonoVF.woff
(Binary or unreadable file)

## src\src\app\fonts\GeistVF.woff
(Binary or unreadable file)

## src\src\app\gallery\page.tsx
```
'use client'

import { useRef, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store/index'
import { deleteImage, addImages } from '@/store/imagesSlice'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from 'next/link'
import { FixedSizeGrid as Grid } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

export default function Gallery() {
  const images = useSelector((state: RootState) => state.images.images)
  const dispatch = useDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleDelete = (id: string) => {
    dispatch(deleteImage(id))
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setLoading(true)
      const imagePromises = Array.from(files).map(file => {
        return new Promise<{ id: string; name: string; data: string; width: number; height: number }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              resolve({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                data: e.target?.result as string,
                width: img.width,
                height: img.height,
              })
            }
            img.src = e.target?.result as string
          }
          reader.readAsDataURL(file)
        })
      })

      const newImages = await Promise.all(imagePromises)
      dispatch(addImages(newImages.map(img => ({ ...img, labels: [] }))))
      setLoading(false)
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const ImageCell = ({ columnIndex, rowIndex, style }: { columnIndex: number, rowIndex: number, style: React.CSSProperties }) => {
    const index = rowIndex * 3 + columnIndex
    if (index >= images.length) return null
    
    const image = images[index]
    return (
      <div style={{
        ...style,
        left: Number(style.left) + 8,
        top: Number(style.top) + 8,
        width: Number(style.width) - 16,
        height: Number(style.height) - 16,
      }}>
        <Card className="relative overflow-hidden h-full">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 p-2">
              <img src={image.data} alt={image.name} className="w-full h-full object-contain" />
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={() => handleDelete(image.id)}
          >
            Delete
          </Button>
          <p className="absolute bottom-0 left-0 right-0 p-2 text-sm truncate bg-white bg-opacity-75">{image.name}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Gallery</h1>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/3 pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl">Loading Images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 bg-gray-100 rounded-lg">
              <p className="text-xl mb-4">No images uploaded yet</p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Images
              </Button>
            </div>
          ) : (
            <div style={{ height: 'calc(100vh - 200px)' }}>
              <AutoSizer>
                {({ height, width }) => (
                  <Grid
                    columnCount={3}
                    columnWidth={(width - 32) / 3}
                    height={height}
                    rowCount={Math.ceil(images.length / 3)}
                    rowHeight={(width - 32) / 3}
                    width={width}
                  >
                    {ImageCell}
                  </Grid>
                )}
              </AutoSizer>
            </div>
          )}
        </div>
        <div className="md:w-1/3 mt-4 md:mt-0">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Gallery Actions</h2>
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Add More Images
              </Button>
              <Link href="/labeling" className="w-full">
                <Button className="w-full" disabled={images.length === 0}>Start Labeling</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}```

## src\src\app\import\page.tsx
```
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { addImages } from '@/store/imagesSlice'
import { Button } from "@/components/ui/button"

export default function Upload() {
  const [files, setFiles] = useState<File[]>([])
  const router = useRouter()
  const dispatch = useDispatch()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleContinue = async () => {
    if (files.length > 0) {
      const imageDataPromises = files.map(file => 
        new Promise<{ id: string; name: string; data: string; width: number; height: number }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              resolve({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                data: e.target?.result as string,
                width: img.width,
                height: img.height,
              })
            }
            img.src = e.target?.result as string
          }
          reader.readAsDataURL(file)
        })
      )

      const imageData = await Promise.all(imageDataPromises)
      dispatch(addImages(imageData.map(img => ({ ...img, labels: [] }))))
      router.push('/gallery')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Import Images</h1>
      <div 
        {...getRootProps()} 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 w-full max-w-md text-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      {files.length > 0 && (
        <div className="mb-4 text-center">
          <p className="text-lg font-semibold">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </p>
        </div>
      )}
      <Button 
        onClick={handleContinue} 
        disabled={files.length === 0}
        className="px-6 py-2"
      >
        Continue to Gallery
      </Button>
    </div>
  )
}```

## src\src\app\labeling\page.tsx
```
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
}```

## src\src\components\Providers.tsx
```
'use client'

import { Provider } from 'react-redux'
import { store } from '@/store/index'

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}```

## src\src\components\ui\button.tsx
```
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## src\src\components\ui\card.tsx
```
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

## src\src\components\ui\checkbox.tsx
```
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

## src\src\components\ui\input.tsx
```
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

## src\src\components\ui\scroll-area.tsx
```
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

## src\src\components\ui\select.tsx
```
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

## src\src\components\ui\slider.tsx
```
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```

## src\src\components\ui\toast.tsx
```
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

## src\src\components\ui\toaster.tsx
```
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

## src\src\hooks\use-toast.ts
```
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

## src\src\lib\utils.ts
```
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## src\src\store\imagesSlice.ts
```
// nk-image-labeler\src\store\imagesSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Label {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageData {
  id: string;
  name: string;
  data: string;
  width: number;
  height: number;
  labels: Label[];
}

interface ImagesState {
  images: ImageData[];
  currentImageIndex: number;
}

const initialState: ImagesState = {
  images: [],
  currentImageIndex: 0,
}

export const imagesSlice = createSlice({
  name: 'images',
  initialState,
  reducers: {
    addImages: (state, action: PayloadAction<ImageData[]>) => {
      state.images = [...state.images, ...action.payload]
    },
    deleteImage: (state, action: PayloadAction<string>) => {
      state.images = state.images.filter(img => img.id !== action.payload)
    },
    updateLabel: (state, action: PayloadAction<{ imageId: string, label: Label }>) => {
      const image = state.images.find(img => img.id === action.payload.imageId)
      if (image) {
        image.labels.push(action.payload.label)
      }
    },
    updateLabels: (state, action: PayloadAction<{ imageId: string, labels: Label[] }>) => {
      const image = state.images.find(img => img.id === action.payload.imageId)
      if (image) {
        image.labels = action.payload.labels
      }
    },
    setCurrentImageIndex: (state, action: PayloadAction<number>) => {
      state.currentImageIndex = action.payload
    },
  },
})

export const { addImages, deleteImage, updateLabel, updateLabels, setCurrentImageIndex } = imagesSlice.actions

export default imagesSlice.reducer```

## src\src\store\index.tsx
```
// nk-image-labeler\src\store\index.tsx

import { configureStore } from '@reduxjs/toolkit'
import imagesReducer from './imagesSlice'

export const store = configureStore({
  reducer: {
    images: imagesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch```

