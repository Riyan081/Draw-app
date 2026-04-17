import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    // Check Authorization header first, then fallback to cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
        ? authHeader.slice(7) 
        : req.cookies?.token;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        if (decoded) {
            req.userId = decoded.userId;
            next();
        } else {
            res.status(403).json({
                message: "Unauthorized"
            });
        }
    } catch (error) {
        res.status(403).json({
            message: "Unauthorized"
        });
    }
}