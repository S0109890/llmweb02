import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MoreCctvs from './pages/MoreCctvs'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/more-cctvs" element={<MoreCctvs />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
