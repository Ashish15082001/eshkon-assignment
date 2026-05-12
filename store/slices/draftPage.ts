import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Page, Section } from '@/lib/schema/page'

interface DraftPageState {
  page: Page | null
}

const initialState: DraftPageState = { page: null }

const draftPageSlice = createSlice({
  name: 'draftPage',
  initialState,
  reducers: {
    loadPage(state, action: PayloadAction<Page>) {
      state.page = action.payload
    },
    addSection(state, action: PayloadAction<Section>) {
      state.page?.sections.push(action.payload)
    },
    reorderSections(state, action: PayloadAction<{ activeIndex: number; overIndex: number }>) {
      if (!state.page) return
      const { activeIndex, overIndex } = action.payload
      const sections = [...state.page.sections]
      const [moved] = sections.splice(activeIndex, 1)
      sections.splice(overIndex, 0, moved)
      state.page.sections = sections
    },
    updateSectionProps(state, action: PayloadAction<{ id: string; props: Record<string, unknown> }>) {
      if (!state.page) return
      const section = state.page.sections.find((s) => s.id === action.payload.id)
      if (!section) return
      // Object.assign lets Immer track prop-level mutations without fighting discriminated-union narrowing
      Object.assign(section.props, action.payload.props)
    },
    removeSection(state, action: PayloadAction<string>) {
      if (!state.page) return
      state.page.sections = state.page.sections.filter((s) => s.id !== action.payload)
    },
  },
})

export const { loadPage, addSection, reorderSections, updateSectionProps, removeSection } =
  draftPageSlice.actions
export default draftPageSlice.reducer
