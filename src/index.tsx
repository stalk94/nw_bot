import React from 'react';
import { createRoot } from 'react-dom/client';
import "./style.css";


function App() {

    return(
        <React.Fragment>
            <section className="Left">

            </section>
            <section className="Right">
                
            </section>
        </React.Fragment>
    )
}



createRoot(document.querySelector(".root")).render(<App/>);