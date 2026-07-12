import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
    userId: string;
    role: string;
}

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};