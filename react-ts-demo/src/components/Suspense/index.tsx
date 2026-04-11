// import React from 'react'

import { Suspense, use } from "react";


const fetchMessage = (): Promise<string> => {
    return new Promise<string>((resolve) => setTimeout(() => resolve("Hello from the future"), 2000))
}

const Message = ({ messagePromise }: { messagePromise: Promise<string> }) => {
    const message: string = use(messagePromise)
    return <p>Message: {message}</p>
} 

export const MySuspense = () => {

    return (
        <div>
            <Suspense fallback={<p> loading message ...</p>}>
                 <Message messagePromise={ fetchMessage() } />
            </Suspense>
        </div>
    )
}