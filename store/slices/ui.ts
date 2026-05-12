import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  selectedSectionId: string | null
  sidebarOpen: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

const initialState: UIState = {
  selectedSectionId: null,
  sidebarOpen: true,
  saveStatus: 'idle',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectSection(state, action: PayloadAction<string | null>) {
      state.selectedSectionId = action.payload
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSaveStatus(state, action: PayloadAction<UIState['saveStatus']>) {
      state.saveStatus = action.payload
    },
  },
})

export const { selectSection, toggleSidebar, setSaveStatus } = uiSlice.actions
export default uiSlice.reducer
