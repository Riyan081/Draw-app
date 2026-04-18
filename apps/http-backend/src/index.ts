import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import express from "express";

import cookieparser from "cookie-parser";
import userRoute from "./routes/user";
import cors from "cors";


const app = express();
app.use(express.json());
app.use(cookieparser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));



app.use("/user", userRoute);


const PORT = process.env.PORT || 3001;
app.listen(PORT,()=>{
    console.log(`Server started on port ${PORT}`);
});