import express from "express";

import cookieparser from "cookie-parser";
import userRoute from "./routes/user";
import cors from "cors";


const app = express();
app.use(express.json());
app.use(cookieparser());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));



app.use("/user", userRoute);


app.listen(3001,()=>{
    console.log("Server started on port 3001");
});