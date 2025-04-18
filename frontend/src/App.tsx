
import Scene from './components/hero/Scene'
import './assets/styles/main.scss'
import Tools from './components/layout/Tools'
import AssetsPanel from './components/layout/AssetsPanel'
import PropertiesPanel from './components/layout/PropertiesPanel'
const App = () => {
  return (
    <div className="content-container">
      <Tools />
      <AssetsPanel />
      <PropertiesPanel />
      <Scene />
    </div>
  )
}

export default App
