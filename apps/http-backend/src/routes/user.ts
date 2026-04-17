import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from "../Middleware/middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";

const userRoute: express.Router = express.Router();

userRoute.post("/signup", async (req: Request, res: Response): Promise<any> => {
    try {
        const isValidData = CreateUserSchema.parse(req.body);
        const { email, password, name } = isValidData;

        const existingUser = await prismaClient.user.findUnique({
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

        const user = await prismaClient.user.create({
            data: {
                email,
                password: hashpassword,
                name
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8d' });
        res.cookie("token", token, { 
            expires: new Date(Date.now() + 8 * 24 * 3600000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(201).json({
            message: "User created successfully",
            success: true,
            token,
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

        const user = await prismaClient.user.findUnique({
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
            token,
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


userRoute.post("/room",middleware,async (req, res): Promise<void> => {
    try {
        const isValidData = CreateRoomSchema.parse(req.body);

        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                error: "Unauthorized",
                success: false
            });
            return;
        }

       const room =  await prismaClient.room.create({
            data: {
                slug: isValidData?.slug,
                adminId: userId,
            }
        });

        res.json({
            message: "Room created successfully",
            success: true,
            room: {
                id: room.id,
            }
        });
        return;
    } catch (err) {
        res.status(400).json({
            error: `Invalid data, ${err}`,
            success: false
        });
        return;
    }
});

userRoute.get("/chats/:roomId", async(req,res)=>{
    try {
        const roomId = Number(req.params.roomId)
        const messages = await prismaClient.chat.findMany({
            where:{
                roomId: roomId
            },
            orderBy:{
                 id:"desc"
            },
            take:50

        })
        res.json({
            message: "Messages retrieved successfully",
            success: true,
            messages: messages
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve messages",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
})

userRoute.get("/room/:slug", async(req,res)=>{
    try {
        const roomId = req.params.slug;
        const messages = await prismaClient.room.findFirst({
            where:{
                slug: roomId
            },
           
        })
        res.json({
            message: "Messages retrieved successfully",
            success: true,
            room: messages
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve room",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
})





// ── My Rooms — rooms created by user + rooms they've drawn in ──
userRoute.get("/rooms", middleware, async (req, res): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized", success: false });
            return;
        }

        // Rooms the user created
        const createdRooms = await prismaClient.room.findMany({
            where: { adminId: userId },
            include: {
                _count: { select: { chats: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Rooms the user has drawn in (but didn't create)
        const drawnInRooms = await prismaClient.room.findMany({
            where: {
                chats: { some: { userId } },
                adminId: { not: userId },
            },
            include: {
                _count: { select: { chats: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({
            success: true,
            createdRooms: createdRooms.map(r => ({
                id: r.id,
                slug: r.slug,
                createdAt: r.createdAt,
                drawingCount: r._count.chats,
            })),
            joinedRooms: drawnInRooms.map(r => ({
                id: r.id,
                slug: r.slug,
                createdAt: r.createdAt,
                drawingCount: r._count.chats,
            })),
        });
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch rooms",
            success: false,
        });
    }
});

export default userRoute;