// @ts-nocheck 
'use client'
import React from "react"
import dynamic from "next/dynamic"

const Chart = dynamic(()=>import('react-apexcharts'),{ssr:false})

export default function Charts(){
    let options = {
        chart: {
            height: 360,
            type: 'area',
            width: '100%',
            stacked: true,
            toolbar: {
                show: false,
                autoSelected: 'zoom'
            },
        },
        colors: ['#94a3b8', '#16a34a'],
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: [1.5, 1.5],
            dashArray: [0, 4],
            lineCap: 'round',
        },
        grid: {
            padding: {
            left: 0,
            right: 0
            },
            strokeDashArray: 3,
        },
        markers: {
            size: 0,
            hover: {
            size: 0
            }
        },
        series: [{
            name: 'No. of Sales',
            data: [0, 100, 40, 110, 60, 140, 55, 130, 65, 180, 75, 115],
        }, {
            name: 'Revenue',
            data: [0, 45, 10, 75, 35, 94, 40, 115, 30, 105, 65, 110],
        }],
        xaxis: {
            type: 'month',
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            axisBorder: {
                show: true,
            },  
            axisTicks: {
                show: true,
            },
        },
        fill: {
            type: "gradient",
            gradient: {
            shadeIntensity: .8,
            opacityFrom: 0.3,
            opacityTo: 0.2,
            stops: [0, 80, 100]
            }
        },
        
        tooltip: {
            x: {
                format: 'dd/MM/yy HH:mm'
            },
        },
        legend: {
            position: 'bottom',
            offsetY: 0,
        },
    }
    return(
        <Chart options={options} series={options.series} type="area" width="100%" height={360} className="apex-chart px-4 pb-6"/> 
    )
}