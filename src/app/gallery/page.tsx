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
}