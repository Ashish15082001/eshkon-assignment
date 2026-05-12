import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type PublishStatus = 'idle' | 'pending' | 'success' | 'error'

interface PublishState {
  status: PublishStatus
  version: string | null
  changelog: string[] | null
  error: string | null
}

const initialState: PublishState = {
  status: 'idle',
  version: null,
  changelog: null,
  error: null,
}

const publishSlice = createSlice({
  name: 'publish',
  initialState,
  reducers: {
    publishStart(state) {
      state.status = 'pending'
      state.error = null
    },
    publishSuccess(state, action: PayloadAction<{ version: string; changelog: string[] }>) {
      state.status = 'success'
      state.version = action.payload.version
      state.changelog = action.payload.changelog
    },
    publishError(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    resetPublish(state) {
      state.status = 'idle'
    },
  },
})

export const { publishStart, publishSuccess, publishError, resetPublish } = publishSlice.actions
export default publishSlice.reducer
