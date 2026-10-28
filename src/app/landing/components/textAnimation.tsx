'use client'
import React from "react";
import { TypeAnimation } from 'react-type-animation';

export default function TextAnimation(){
    return(
        <h1 className="font-semibold text-white lg:leading-normal leading-normal text-4xl lg:text-6xl mb-6">Find the perfect <br/> 
        <TypeAnimation
            sequence={[
                // Same substring at the start will only be typed out once, initially
                'home',
                1000, // wait 1s before replacing "Mice" with "Hamsters"
                'villa',
                1000,
                'office',
                1000,
            ]}
            wrapper="span"
            speed={40}
            style={{ fontSize: '1ren', display: 'inline-block' }}
            repeat={Infinity}
            cursor={false}
            /> for you</h1>
    )
}
