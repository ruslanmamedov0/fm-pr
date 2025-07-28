import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MatchUi from './MatchUi'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <MatchUi/>
    </>
  )
}

export default App
