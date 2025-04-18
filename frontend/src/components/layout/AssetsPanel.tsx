import React, { useState } from 'react'
import { ArrowIcon } from '../../assets/images/svgExports'
type Asset = {
  id: number
  name: string
  category: string
  image: string
}
const AssetsPanel = () => {
  const [panelOpen, setPanelOpen] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([
    { id: 1, name: 'Modern Sofa', category: 'Furniture', image: '/assets/furniture/sofa.png' },
    { id: 2, name: 'Dining Table', category: 'Furniture', image: '/assets/furniture/dining-table.png' },
    { id: 3, name: 'Wooden Door', category: 'Doors', image: '/assets/doors/wooden-door.png' },
    { id: 4, name: 'Glass Door', category: 'Doors', image: '/assets/doors/glass-door.png' },
    { id: 5, name: 'Flat Roof', category: 'Roofs', image: '/assets/roofs/flat-roof.png' },
    { id: 6, name: 'Gabled Roof', category: 'Roofs', image: '/assets/roofs/gabled-roof.png' },
    { id: 7, name: 'Brick Wall', category: 'Walls', image: '/assets/walls/brick-wall.png' },
    { id: 8, name: 'Concrete Wall', category: 'Walls', image: '/assets/walls/concrete-wall.png' },
    { id: 9, name: 'Floor Tiles', category: 'Floors', image: '/assets/floors/floor-tiles.png' },
    { id: 10, name: 'Hardwood Floor', category: 'Floors', image: '/assets/floors/hardwood.png' },
    { id: 11, name: 'Kitchen Island', category: 'Kitchen', image: '/assets/kitchen/kitchen-island.png' },
    { id: 12, name: 'Modern Sink', category: 'Kitchen', image: '/assets/kitchen/sink.png' },
  ])
  return (
    <div className={`assets-panel-container ${panelOpen ? 'active' : ''}`}>
      <div className="assets-panel">
        <div className={`icon ${panelOpen ? 'active' : ''}`} onClick={() => setPanelOpen(!panelOpen)}>
          <ArrowIcon />
        </div>

        <div className="assets-wrapper">
          {assets.map((asset, index) => (
            <div className="asset-box" key={asset.id}>
              <div className="asset-image">
                <img src={asset.image} alt={asset.name} />
              </div>
              <div className="asset-name">{asset.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AssetsPanel
