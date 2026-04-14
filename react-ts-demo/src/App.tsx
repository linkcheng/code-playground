import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import MyCom from './components/MyCom'
import { MyList } from './components/List'
import { MyHooks } from './components/Hooks'
import { MyForm } from './components/Form'
import { MyFormAction, MyFormAction2 } from './components/FormAction'
import { MySuspense } from './components/Suspense'
import { MyReducer } from './components/Reducer'
import { Parent } from './components/Context/Parent'
import { MyMemo } from './components/Memo'
import { CustomHooks, ScrollTop } from './components/CustomHooks'
import { MyZod } from './components/MyZod'

function App() {
  // const [count, setCount] = useState(0)
  const [isShow, setIsShow] = useState(true)

  return (
    <>
      <section id="center">
      <MyCom
        label="点我+1"
        render={(num) => <p>Current count: {num}</p>}
      />
      
      <MyList />

      {isShow && <MyHooks />}
      <div style={{ textAlign: 'center' }}>
         <button onClick={() => setIsShow(!isShow)}>Toggle</button>
      </div>


      <MyForm />
     
      <MyFormAction />

      <MyFormAction2 />

      <MySuspense />
        
      <MyReducer />
        
      <Parent />
      
      <MyMemo />
      <MyMemo />
      
      <CustomHooks />  

      <ScrollTop />
      
      <MyZod />

      </section>
      {/* <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section> */}
    </>
  )
}

export default App
