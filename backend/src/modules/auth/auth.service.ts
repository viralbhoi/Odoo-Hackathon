import bcrypt from "bcrypt";
import authRepository from "./auth.repository";
import { AppError } from "../../common/errors/AppError";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../../common/utils/jwt";

class AuthService {
    async login(email: string, password: string) {
        const user = await authRepository.findUserByEmail(email);

        if (!user) {
            throw new AppError(401, "Invalid Credentials");
        }

        if (!user.password) {
            throw new AppError(401, "Please login with Google");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new AppError(401, "Invalid Credentials");
        }

        const accessToken = generateAccessToken(user.id, user.role);

        const refreshToken = generateRefreshToken(user.id);

        return {
            accessToken,
            refreshToken,
            user,
        };
    }

    async me(userId: string) {
        const user = await authRepository.findUserById(userId);

        if (!user) {
            throw new AppError(404, "User not found");
        }

        const { password, ...safeUser } = user;

        return safeUser;
    }
}

export default new AuthService();
