import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import imagesReducer from './imagesSlice'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['images']
}

const persistedReducer = persistReducer(persistConfig, imagesReducer)

export const store = configureStore({
  reducer: {
    images: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch