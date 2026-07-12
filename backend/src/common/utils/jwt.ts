import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateAccessToken = (
    userId: string,
    role: string
) => {
    return jwt.sign(
        {
            userId,
            role,
        },
        env.JWT_SECRET,
        {
            expiresIn: "8h",
        }
    );
};

export const generateRefreshToken = (
    userId: string
) => {
    return jwt.sign(
        {
            userId,
        },
        env.JWT_REFRESH_SECRET,
        {
            expiresIn: "7d",
        }
    );
};