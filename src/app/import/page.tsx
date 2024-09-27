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
}