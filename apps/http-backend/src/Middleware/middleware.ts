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
    const { token } = req.cookies;

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