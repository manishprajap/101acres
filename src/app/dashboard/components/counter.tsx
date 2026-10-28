'use client'
import React from "react"
import CountUp from 'react-countup';

export default function Counter({start, end}:{start:number, end:number}){
    return(
        <CountUp start={start} end={end}/>
    )
}
