import React from "react";
import ZoomableIcicle from "./ZoomableIcicle";
import './styles.css';
import background from "./pic.jpg";


function App() {
    return (
        <div
            style={{
                backgroundImage: `url(${background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                height: "100vh",
            }}
        ><h1>History of Colonization</h1>
            <ZoomableIcicle/>
        </div>
    );
}

export default App;
