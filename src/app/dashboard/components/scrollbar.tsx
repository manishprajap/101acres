'use client'
import React from "react"

import SimpleBar from "simplebar-react"

export default function ScrollBar(props: { className: string | undefined; children: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | ((props: { scrollableNodeRef: React.MutableRefObject<HTMLElement | undefined>; scrollableNodeProps: { className: string; ref: React.MutableRefObject<HTMLElement | undefined> }; contentNodeRef: React.MutableRefObject<HTMLElement | undefined>; contentNodeProps: { className: string; ref: React.MutableRefObject<HTMLElement | undefined> } }) => React.ReactNode) | null | undefined }){
    return(
        <SimpleBar className={props.className}>
            {props.children}
        </SimpleBar>
    )
}