import { useState } from 'react'


export const MyForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log('Form submitted', formData)
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <label>
                Name:
                <input type="text" name="username" onChange={(e) => { setFormData({ ...formData, username: e.target.value }) }}/>
            </label>
            <label>
                Password:
                <input type="password" name="password" onChange={(e ) => { setFormData({ ...formData, password: e.target.value }) }}/>
            </label>
            <button type="submit">Submit</button>
        </form>
    )
}