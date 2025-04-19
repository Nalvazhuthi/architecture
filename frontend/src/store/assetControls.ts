import { create } from "zustand";

// Update your Asset interface to include 3D properties
export type Asset = {
  id: number;
  name: string;
  category: string;
  image: string;
  boundingBox?: any;
  position?: { x: number; y: number; z?: number }; // Added z for 3D
  rotation?: { x: number; y: number; z?: number }; // For 3D rotation
  scale?: { x: number; y: number; z?: number }; // For 3D scaling
  modelUrl?: string; // Path to 3D model file
};

interface AssetControlState {
  draggedAsset: Asset | null;
  setDraggedAsset: (asset: Asset | null) => void;

  selectedAsset: number | null;
  setSelectedAsset: (id: number | null) => void;

  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  addAsset: (
    asset: Asset,
    position?: { x: number; y: number; z?: number }
  ) => void;
  deleteAsset: (id: number) => void;
  updateAssetPosition: (
    id: number,
    position: { x: number; y: number; z?: number }
  ) => void;
  updateAssetRotation: (
    id: number,
    rotation: { x: number; y: number; z?: number }
  ) => void;
  updateAssetScale: (
    id: number,
    scale: { x: number; y: number; z?: number }
  ) => void;
}

export const useAssetControl = create<AssetControlState>((set) => ({
  draggedAsset: null,
  setDraggedAsset: (asset) => set({ draggedAsset: asset }),
  selectedAsset: null,
  setSelectedAsset: (id) => set({ selectedAsset: id }),
  assets: [],
  setAssets: (assets) => set({ assets }),

  addAsset: (asset, position) =>
    set((state) => ({
      assets: [
        ...state.assets,
        {
          ...asset,
          id: Date.now(),
          position: position || { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      ],
    })),

  deleteAsset: (id) =>
    set((state) => ({
      assets: state.assets.filter((asset) => asset.id !== id),
    })),

  updateAssetPosition: (id, position) =>
    set((state) => ({
      assets: state.assets.map((asset) =>
        asset.id === id ? { ...asset, position } : asset
      ),
    })),

  updateAssetRotation: (id, rotation) =>
    set((state) => ({
      assets: state.assets.map((asset) =>
        asset.id === id ? { ...asset, rotation } : asset
      ),
    })),

  updateAssetScale: (id, scale) =>
    set((state) => ({
      assets: state.assets.map((asset) =>
        asset.id === id ? { ...asset, scale } : asset
      ),
    })),
}));
