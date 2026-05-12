import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import draftPageReducer from './slices/draftPage'
import uiReducer from './slices/ui'
import publishReducer from './slices/publish'

export const store = configureStore({
  reducer: {
    draftPage: draftPageReducer,
    ui: uiReducer,
    publish: publishReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
