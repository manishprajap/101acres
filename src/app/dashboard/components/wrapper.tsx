'use client'
import React,{useState} from 'react'
import Sidebar from './sidebar'
import TopHeader from './topHeader'
import Footer from './footer'
import Switcher from './switcher'

export default function Wrapper(props: { children: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined }){
    let [toggle, setToggle] = useState(false)
    return(
        <div className={`${toggle ? '' : 'toggled' } page-wrapper`}>
            <Sidebar/>
            <main className="page-content bg-gray-50 dark:bg-slate-800">
                <TopHeader toggle={toggle} setToggle={setToggle} />
                   {props.children}
                <Footer/>
                {/* <Switcher/> */}
            </main>
        </div>
    )
}