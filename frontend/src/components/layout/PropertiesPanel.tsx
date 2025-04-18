import React, { useState } from 'react'

const PropertiesPanel = () => {
  const [isVisible, setIsVisible] = useState(true)

  const togglePanel = () => {
    setIsVisible(!isVisible)
  }

  const [selectedElement, setSelectedElement] = useState({
    id: 1,
    name: 'Wall',
    height: 2.4,
    width: 5.0,
    texture: 'Brick',
    metadata: { category: 'Living Room', type: 'Wall' },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSelectedElement((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <>
      {isVisible && (
        <div className={`properties-panel ${isVisible ? 'active' : ''}`}>
          <div className="close-btn" onClick={togglePanel}>
            ✕
          </div>

          <h2>{selectedElement.name} Properties</h2>

          <div className="property">
            <label htmlFor="height">Height (m):</label>
            <input type="number" id="height" name="height" value={selectedElement.height} onChange={handleChange} />
          </div>

          <div className="property">
            <label htmlFor="texture">Texture:</label>
            <select id="texture" name="texture" value={selectedElement.texture} onChange={handleChange}>
              <option value="Brick">Brick</option>
              <option value="Concrete">Concrete</option>
              <option value="Wood">Wood</option>
            </select>
          </div>

          <div className="metadata">
            <h3>Metadata</h3>
            <div className="metadata-item">
              <strong>Category:</strong> {selectedElement.metadata.category}
            </div>
            <div className="metadata-item">
              <strong>Type:</strong> {selectedElement.metadata.type}
            </div>
          </div>
        </div>
      )}

      {!isVisible && (
        <button className="open-btn" onClick={togglePanel}>
          Open
        </button>
      )}
    </>
  )
}

export default PropertiesPanel
