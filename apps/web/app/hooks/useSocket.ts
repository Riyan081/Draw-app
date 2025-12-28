import { useEffect,useState } from "react";
import { WS_BACKEND_URL } from "../config";

export function useSocket(){
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [loading,setLoading] = useState(true);

    useEffect(()=>{
     const ws = new WebSocket(`${WS_BACKEND_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMTU1OWE2Mi1iN2IyLTQ0NGQtOTU4MS01ZDI1OWViMTEzMWUiLCJpYXQiOjE3NjY4Njg0MDMsImV4cCI6MTc2NzU1OTYwM30.XYsMRy4n7V4lhX0jaa8L7RhgcYLQn3PmvAQsYeBg7do`);
     ws.onopen = ()=>{
        setSocket(ws);
        setLoading(false);
     }
    },[])
    return {socket, loading};


}