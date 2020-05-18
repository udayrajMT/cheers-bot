import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Client from "./client";

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <Client/>
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById('app'))
