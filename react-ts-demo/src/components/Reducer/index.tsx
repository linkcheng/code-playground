import { useReducer} from "react";

const initalState = {
    name: "hello",
    age: 18
}

const reducer = (
    state: typeof initalState,
    action: {type: string, payload: string}
) => {
    switch (action.type) {
        case "changeName":
            return {
                ...state,
                name: action.payload
            }
        case "changeAge":
            return {
                ...state,
                age: Number(action.payload)
            }
        default:
            return state;
    }
}

export const MyReducer = () => {
    const [state, dispatch] = useReducer(reducer, initalState);

    return (
       
        <div>
            <p>name: {state.name }</p>
            <p>aget: {state.age} </p>

            <input type="text" value={state.name} onChange={(ev) => dispatch({ type: "changeName", payload: ev.target.value})} />
            <input type="text" value={state.age} onChange={(ev) => dispatch({ type: "changeAge", payload: ev.target.value})} />
        </div>
    );
}