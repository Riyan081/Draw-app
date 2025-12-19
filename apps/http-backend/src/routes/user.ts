import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from "../Middleware/middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import prisma from "@repo/db/client";
import bcrypt from "bcrypt";

const userRoute: express.Router = express.Router();

userRoute.post("/signup", async (req: Request, res: Response): Promise<any> => {
    try {
        const isValidData = CreateUserSchema.parse(req.body);
        const { email, password, name } = isValidData;

        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        });
        
        if (existingUser) {
            return res.status(400).json({
                error: "User already exists",
                success: false
            });
        }

        const hashpassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashpassword,
                name
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8d' });
        res.cookie("token", token, { expires: new Date(Date.now() + 8 * 3600000) });

        res.status(201).json({
            message: "User created successfully",
            success: true,
            user:{
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        res.status(400).json({
            error: `Invalid data, ${err}`,
            success: false
        });
    }
});


userRoute.post("/signin", async (req: Request, res: Response): Promise<any> => {
    try {
        const isValidData = SigninSchema.parse(req.body);
        const { email, password } = isValidData;

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        });
        
        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password",
                success: false
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid email or password",
                success: false
            });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8d' });
        res.cookie("token", token, { 
            expires: new Date(Date.now() + 8 * 24 * 3600000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(200).json({
            message: "Login successful",
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        res.status(400).json({
            error: `Invalid data, ${err}`,
            success: false
        });
    }
});

export default userRoute;