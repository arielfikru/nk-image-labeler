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

export default imagesSlice.reducer