import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MoreCctvs from './pages/MoreCctvs'
import Marionette from './pages/Marionette'
import VendingMachine from './pages/VendingMachine'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/more-cctvs" element={<MoreCctvs />} />
        <Route path="/marionette" element={<Marionette />} />
        <Route path="/vending" element={<VendingMachine />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
