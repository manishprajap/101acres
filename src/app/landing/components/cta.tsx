"use client"
import React from 'react'
import CountUp from 'react-countup';
export default function Cta() {
  return (
        <section className="relative py-24 bg-no-repeat bg-center bg-fixed bg-cover" style={{backgroundImage:'url("/images/bg/01.jpg")'}}>
            <div className="absolute inset-0 bg-slate-900/60"></div>
            <div className="container relative">
                <div className="grid lg:grid-cols-12 grid-cols-1 md:text-start text-center justify-center">
                    <div className="lg:col-start-2 lg:col-span-10">
                        <div className="grid md:grid-cols-3 grid-cols-1 items-center">
                            
                            <div className="counter-box text-center">
                                <h1 className="text-white lg:text-5xl text-4xl font-semibold mb-2"><CountUp className="counter-value" end={1548} />+</h1>
                                <h5 className="counter-head text-white text-lg font-medium">Properties Sell</h5>
                            </div>
        
                            
                            <div className="counter-box text-center">
                                <h1 className="text-white lg:text-5xl text-4xl font-semibold mb-2"><CountUp className="counter-value" end={25} />+</h1>
                                <h5 className="counter-head text-white text-lg font-medium">Award Gained</h5>
                            </div>
        
                            
                            <div className="counter-box text-center">
                                <h1 className="text-white lg:text-5xl text-4xl font-semibold mb-2"><CountUp className="counter-value" end={9} />+</h1>
                                <h5 className="counter-head text-white text-lg font-medium">Years Experience</h5>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
  )
}