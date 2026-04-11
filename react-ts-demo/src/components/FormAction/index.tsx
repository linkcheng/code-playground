// import React from 'react'

import { useActionState } from "react";
import { useFormStatus } from "react-dom";


function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const MyFormAction = () => {

    const handleAction = (formData: FormData) => {
        console.log('Form submitted', {
            username: formData.get('username'),
            password: formData.get('password')
        });
    }
    
    return (
        <form action={handleAction} method="POST">
            <label>
                Name:
                <input type="text" name="username" />
            </label>
            <label>
                Password:
                <input type="password" name="password"  />
            </label>
            <button type="submit">Submit</button>
        </form>
    )
}

const MyButton = () => {
    const { pending, data, action, method } = useFormStatus()
    console.log("pending=", pending)
    console.log("data=", data)
    console.log("method=", method)
    console.log("action=", action)
    return <button type="submit"> { pending ? "Submitting": "Submit"}</button>
}

interface ActionState {
    success: boolean;
    data: {
        username: FormDataEntryValue | null;
        password: FormDataEntryValue | null;
    };
}

export const MyFormAction2 = () => {

    const handleAction2 = async (prevState: ActionState | null, formData: FormData) => {
        console.log('Form submitted', prevState, {
            username: formData.get('username'),
            password: formData.get('password')
        });

        await delay(1000)

        return {
            success: true,
            data: {
                username: formData.get('username'),
                password: formData.get('password')
            }
        }
    }

    const [state, submitAction, isPending] = useActionState(handleAction2, null)
    console.log("state=", state)
    console.log("isPending=", isPending)
    return (
        <form action={submitAction} method="POST">
            <label>
                Name:
                <input type="text" name="username" />
            </label>
            <label>
                Password:
                <input type="password" name="password"  />
            </label>
            {/* <button type="submit">Submit</button> */}

            {/*  深层状态用 context，而不是 props 传值*/}
            <MyButton />
        </form>
    )
}