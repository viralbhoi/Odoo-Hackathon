import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export const authorize =
    (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError(401, "Unauthorized"));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError(403, "Forbidden"));
        }

        next();
    };
