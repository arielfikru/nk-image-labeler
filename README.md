# NK Simple Image Annotator

A simple yet powerful tool for image annotation and labeling, built with Next.js and Redux.

## Overview

NK Simple Image Annotator is a web application that allows users to upload images and create bounding box annotations. It supports multiple export formats and provides an intuitive interface for image labeling tasks.

## Features

- Image upload and management
- Bounding box annotation
- Multiple export formats (COCO, YOLO, Image)
- Real-time label visualization
- Responsive design
- Keyboard shortcuts for improved workflow
- Data persistence across browser sessions

## 01/02/2025 Major Updates

### Data Persistence System
- **New**: 
  - Added data persistence using redux-persist
  - Images and annotations survive page refreshes
  - Data persists across browser sessions
  - Automatic state recovery on page load
- **Old**: Data was lost on page refresh

### Label Class Management System
- **New**: Added support for custom label classes with color coding
- **Old**: Single label type without classification

### UI/UX Improvements
1. Tools Panel
   - **New**: Added dedicated tools panel with Select (V) and Box (B) tools
   - **Old**: Only had box tool available

2. Label Interaction
   - **New**: 
     - Select and highlight individual labels
     - Edit existing labels
     - Color-coded label classes
   - **Old**: Basic label visualization without interaction

3. Export Options
   - **New**:
     - Support for label classes in COCO and YOLO exports
     - More comprehensive export settings
   - **Old**: Basic export functionality without label class support

### Technical Improvements

1. State Management
   - **New**: 
     ```typescript
     interface ImagesState {
       images: ImageData[];
       currentImageIndex: number;
       labelClasses: string[]; 
     }

     // Added redux-persist configuration
     const persistConfig = {
       key: 'root',
       storage,
       whitelist: ['images']
     }
     ```
   - **Old**:
     ```typescript
     interface ImagesState {
       images: ImageData[];
       currentImageIndex: number;
     }
     ```

2. Label Structure
   - **New**:
     ```typescript
     interface Label {
       x: number;
       y: number;
       width: number;
       height: number;
       class: string;
     }
     ```
   - **Old**:
     ```typescript
     interface Label {
       x: number;
       y: number;
       width: number;
       height: number;
     }
     ```

3. Redux Actions
   - **New**:
     - Added `addLabelClass`
     - Added `renameLabelClass`
     - Added persistence configuration
   - **Old**: Basic image and label management actions only

4. Provider Structure
   - **New**:
     ```typescript
     // Added PersistGate wrapper
     <Provider store={store}>
       <PersistGate loading={null} persistor={persistor}>
         {children}
       </PersistGate>
     </Provider>
     ```
   - **Old**: Basic Redux Provider only

## Installation

1. Clone the repository
```bash
git clone https://github.com/arielfikru/nk-image-labeler.git
```

2. Install dependencies
```bash
cd nk-image-labeler
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Or just Build and Run
```bash
npm run build
npm run start
```

## Usage

1. Start the application and click "Start Labeling"
2. Import images through the upload interface
3. Use the labeling interface to create bounding boxes:
   - Use 'B' key for box tool
   - Use 'V' key for select tool
   - Hold CTRL and move mouse to resize box
   - Use mouse wheel to adjust box size proportionally
   - Hold SHIFT to add multiple labels to an image
4. Export your labeled data in your preferred format

## Keyboard Shortcuts

- `B`: Switch to Box tool
- `V`: Switch to Select tool
- `CTRL + Mouse Move`: Resize box width/height independently
- `SHIFT + Click`: Add multiple labels without advancing to next image
- `Mouse Wheel`: Adjust box size proportionally

## Export Formats

1. Image Export
   - Labeled images with bounding boxes
   - Multiple format options (PNG, JPG, WebP)
   - Option to export crops only

2. COCO Format
   - Standard COCO annotation format
   - Includes label classes
   - Supports multiple categories

3. YOLO Format
   - Normalized coordinates
   - One text file per image
   - Class index mapping

## Technology Stack

- Next.js
- Redux Toolkit
- TypeScript
- Tailwind CSS
- Radix UI Components
- React Window (virtualization)

## Performance Improvements

- Added image virtualization for better performance with large datasets
- Optimized canvas rendering with throttling
- Improved state management for better memory usage

## Future Improvements

- [ ] Add polygon annotation support
- [ ] Implement annotation history/undo
- [ ] Add keyboard shortcuts customization
- [ ] Support for pre-trained model integration
- [ ] Add annotation statistics and analytics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.