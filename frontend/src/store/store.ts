import { create } from 'zustand';

// Tool bar
interface ToolState {
  activeTool: string;
  is3d: boolean; // true for 3D, false for 2D
  gridSnap: boolean; // true for 3D, false for 2D
  setActiveTool: (tool: string) => void;
  setIs3d: (is3d: boolean) => void; // Toggle between 2D/3D
  setGridSnap: (is3d: boolean) => void; // Toggle between 2D/3D
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'PolygonWall', // Default tool
  is3d: false, // Default is 2D (false)
  gridSnap: true, // Default is 2D (false)
  setActiveTool: (tool) => set({ activeTool: tool }),
  setIs3d: (is3d) => set({ is3d }), // Set is3d to either true or false
  setGridSnap: (gridSnap) => set({ gridSnap }), // Set is3d to either true or false
}));






