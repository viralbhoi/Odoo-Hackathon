import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/verifyJwt";
import { AppError } from "../errors/AppError";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string;
            };
        }
    }
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return next(new AppError(401, "Unauthorized"));
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);

        req.user = payload;

        next();
    } catch {
        next(new AppError(401, "Invalid Token"));
    }
};