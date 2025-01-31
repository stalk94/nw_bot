import React from 'react';
import { createRoot } from 'react-dom/client';
import "./style.css";


async function send(url: string, data: any, metod: 'GET'|'POST') {
    let dataServer = {
        method: metod ?? 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    if(metod!=='GET') dataServer.body = JSON.stringify(data);

    const request = await fetch(window.location.href + url, dataServer);
    return request.json();
}


function App() {
    const [msg, setMsg] = React.useState<Array<string[]>>([]);
    const [sys, setSys] = React.useState<Array<string[]>>([]);

    const parser =(text: string)=> {
        return text.match(/(^\S+)\s+(\d{2}-\d{2}-\d{4} \[\d{2}:\d{2}:\d{2}\])\s*:\s*(.+)/);
    }
    React.useEffect(()=> {
        setInterval(()=> {
            send('chek', {}, 'POST').then((data)=> {
                setMsg(data.msg);
                if(data.sys) {
                    const lines = data.sys?.split('\n');
                    const cleaned = lines.map(str => str.trim()).filter(str => str !== "");
                    setSys(cleaned);
                }
            });
        }, 2000);

    }, []);


    return(
        <React.Fragment>
            <section className="Left">
                {msg.map((msg, index)=> 
                    <div key={index} className='MSG'>
                        { msg }
                    </div>
                )}
            </section>
            <section className="Right">
                {sys.map((msg, index)=> 
                    <div key={index} className='MSG'>
                        { msg }
                    </div>
                )}
            </section>
        </React.Fragment>
    )
}



createRoot(document.querySelector(".root")).render(<App/>);