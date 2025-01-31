'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import JSZip from 'jszip'
import { FixedSizeGrid as Grid } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { useRouter } from "next/navigation"
import Image from 'next/image'

type ExportFormat = 'image' | 'coco' | 'yolo'
type DownloadType = 'zip' | 'individual'
type ImageFormat = 'png' | 'jpg80' | 'jpg100' | 'webp'
type DownloadFormat = 'full' | 'crop'

interface Label {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
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
      const image = new window.Image()
      image.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        if (ctx) {
          ctx.drawImage(image, 0, 0)
        
          img.labels.forEach(label => {
            const color = 'rgba(0, 0, 255, 0.2)' // Semi-transparent blue
            ctx.fillStyle = color
            ctx.fillRect(label.x, label.y, label.width, label.height)
            ctx.strokeStyle = 'blue'
            ctx.lineWidth = 2
            ctx.strokeRect(label.x, label.y, label.width, label.height)
            
            // Add label class text
            ctx.fillStyle = 'blue'
            ctx.font = '14px Arial'
            ctx.fillText(label.class, label.x, label.y - 5)
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
    const categories = Array.from(new Set(images.flatMap(img => img.labels.map(label => label.class))))
      .map((className, index) => ({
        id: index + 1,
        name: className,
        supercategory: "none"
      }));

    const cocoData = {
      images: images.map((img) => ({
        id: parseInt(img.id),
        file_name: img.name,
        width: img.width,
        height: img.height
      })),
      annotations: images.flatMap((img) => 
        img.labels.map((label, labelIndex) => ({
          id: parseInt(img.id) * 1000 + labelIndex,
          image_id: parseInt(img.id),
          category_id: categories.find(cat => cat.name === label.class)?.id,
          bbox: [label.x, label.y, label.width, label.height],
          area: label.width * label.height,
          iscrowd: 0
        }))
      ),
      categories: categories
    }
    return JSON.stringify(cocoData, null, 2)
  }

  const generateYOLOData = (img: ImageData): string => {
    const allClasses = Array.from(new Set(images.flatMap(img => img.labels.map(label => label.class))));
    
    return img.labels.map(label => {
      const classIndex = allClasses.indexOf(label.class);
      const centerX = (label.x + label.width / 2) / img.width;
      const centerY = (label.y + label.height / 2) / img.height;
      const width = label.width / img.width;
      const height = label.height / img.height;
      return `${classIndex} ${centerX} ${centerY} ${width} ${height}`;
    }).join('\n');
  }

  const handleDownload = async () => {
    const zip = new JSZip()

    if (exportFormat === 'image') {
      await Promise.all(images.map(async (img) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const image = new window.Image()
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
              const color = 'rgba(0, 0, 255, 0.2)' // Semi-transparent blue
              ctx.fillStyle = color
              ctx.fillRect(label.x, label.y, label.width, label.height)
              ctx.strokeStyle = 'blue'
              ctx.lineWidth = 2
              ctx.strokeRect(label.x, label.y, label.width, label.height)
              
              // Add label class text
              ctx.fillStyle = 'blue'
              ctx.font = '14px Arial'
              ctx.fillText(label.class, label.x, label.y - 5)
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
            zip.file(`${img.name.split('.')[0]}_${label.class}_${labelIndex + 1}.${imageFormat}`, dataUrl.split(',')[1], {base64: true})
          })
        }
      }))
    } else if (exportFormat === 'coco') {
      const cocoData = generateCOCOData(images)
      zip.file('annotations.json', cocoData)
      images.forEach((img) => {
        zip.file(`images/${img.name}`, img.data.split(',')[1], {base64: true})
      })

      // Add classes.txt for reference
      const allClasses = Array.from(new Set(images.flatMap(img => img.labels.map(label => label.class))));
      zip.file('classes.txt', allClasses.join('\n'))
    } else if (exportFormat === 'yolo') {
      // Create classes.txt first
      const allClasses = Array.from(new Set(images.flatMap(img => img.labels.map(label => label.class))));
      zip.file('classes.txt', allClasses.join('\n'))

      // Add image and label files
      images.forEach((img) => {
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
            <div className="relative w-full h-full">
              <Image 
                src={renderedImages[index]} 
                alt={images[index].name} 
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
          <p className="p-2 text-sm truncate">{images[index].name}</p>
        </Card>
      </div>
    )
  }

  const handleBack = () => {
    router.push("/labeling");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <Button onClick={handleBack} className="mr-4">Back</Button>
        <h1 className="text-2xl font-bold">Export Images</h1>
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
              <Button 
                onClick={handleDownload} 
                className="w-full"
              >
                Download
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}