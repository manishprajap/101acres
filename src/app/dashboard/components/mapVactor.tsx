// @ts-nocheck
'use client'

import {useEffect} from "react";

import jsVectorMap from 'jsvectormap'
import 'jsvectormap/dist/maps/world'

export default function MapVactor(){

    useEffect(() => {
        new jsVectorMap({
            map: 'world',
            selector: '#map',
            zoomOnScroll: true,
            zoomButtons: false,
            selectedMarkers: [0, 1],
            markersSelectable: true,
            markers:[
                { name: "Palestine", coords: [31.9474,35.2272] },
                { name: "Russia", coords: [61.524,105.3188] },
                { name: "Canada", coords: [56.1304,-106.3468] },
                { name: "Greenland", coords: [71.7069,-42.6043] },
            ],
            markerStyle:{
                initial: { fill: "#4f46e5" },
                selected: { fill: "#059669" }
            },
            labels: {
                markers: {
                render: marker => marker.name
                }
            }
        });
      }, []);


    return(
        <>
        <div className='w-full h-[236px] jvm-container'>
            <div id="map" className="w-full h-[236px]"></div>
        </div>
        <div className="p-6">
            <ul className="list-none flex">
                <li className="inline-block w-1/2"><span className="text-green-600 font-semibold">Canada</span>:<span className="text-slate-400 ms-2">12468</span></li>
                <li className="inline-block w-1/2"><span className="text-green-600 font-semibold">Greenland</span>:<span className="text-slate-400 ms-2">12468</span></li>
            </ul>
            <ul className="list-none flex">
                <li className="inline-block w-1/2"><span className="text-green-600 font-semibold">Russia</span>:<span className="text-slate-400 ms-2">12468</span></li>
                <li className="inline-block w-1/2"><span className="text-green-600 font-semibold">Palestine</span>:<span className="text-slate-400 ms-2">12468</span></li>
            </ul>
        </div>
        </>
    )
}