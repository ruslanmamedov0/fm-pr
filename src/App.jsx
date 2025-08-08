import { useState } from 'react'
import './App.css'
import MatchUi from './MatchUi'

function App() {
  const [count, setCount] = useState(0)

  return (
     <div>
     <MatchUi/>
    </div>
  )
}

export default App
