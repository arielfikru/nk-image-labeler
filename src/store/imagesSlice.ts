import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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

interface ImagesState {
  images: ImageData[];
  currentImageIndex: number;
  labelClasses: string[];
}

const initialState: ImagesState = {
  images: [],
  currentImageIndex: 0,
  labelClasses: [],
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
    addLabelClass: (state, action: PayloadAction<string>) => {
      if (!state.labelClasses.includes(action.payload)) {
        state.labelClasses.push(action.payload)
      }
    },
    renameLabelClass: (state, action: PayloadAction<{ oldName: string; newName: string }>) => {
      const { oldName, newName } = action.payload;
      
      // Update the label classes array
      const classIndex = state.labelClasses.indexOf(oldName);
      if (classIndex !== -1) {
        state.labelClasses[classIndex] = newName;
      }

      // Update all existing labels with this class
      state.images.forEach(image => {
        image.labels.forEach(label => {
          if (label.class === oldName) {
            label.class = newName;
          }
        });
      });
    },
  },
})

export const {
  addImages,
  deleteImage,
  updateLabel,
  updateLabels,
  setCurrentImageIndex,
  addLabelClass,
  renameLabelClass,
} = imagesSlice.actions

export default imagesSlice.reducer