'use client'
import React,{useState,useEffect} from "react";

export default function CountDown(){

    let [days, setDays] = useState<number>(0);
    let [hours, setHours] = useState<number>(0);
    let [minutes, setMinutes] = useState<number>(0);
    let [seconds, setSeconds] = useState<number>(0);

    let deadline = "December, 31, 2025";

    let getTime = () => {
      let time = Date.parse(deadline) - Date.now();
      setDays(Math.floor(time / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((time / (1000 * 60 * 60)) % 24));
      setMinutes(Math.floor((time / 1000 / 60) % 60));
      setSeconds(Math.floor((time / 1000) % 60));
    };

    useEffect(() => {
      let interval = setInterval(() => getTime(), 1000);
      return () => clearInterval(interval);
    })
    
    return(
        <div id="countdown">
            <ul className="count-down list-none inline-block text-white text-center mt-8 m-6">
                <li id="days" className="count-number inline-block m-2">{days}<p className='count-head'>Days</p></li>
                <li id="hours" className="count-number inline-block m-2">{hours}<p className='count-head'>Hours</p></li>
                <li id="mins" className="count-number inline-block m-2">{minutes}<p className='count-head'>Mins</p></li>
                <li id="secs" className="count-number inline-block m-2">{seconds}<p className='count-head'>Secs</p></li>
                <li id="end" className="h1"></li>
            </ul>
        </div>
    )
}