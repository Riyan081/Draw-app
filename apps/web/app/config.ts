const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const WS_BACKEND_URL = process.env.NEXT_PUBLIC_WS_BACKEND_URL || "ws://localhost:8080"
export { BACKEND_URL, WS_BACKEND_URL };