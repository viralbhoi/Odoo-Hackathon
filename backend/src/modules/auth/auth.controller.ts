import { Request, Response } from "express";
import authService from "./auth.service";
import { asyncHandler } from "../../common/utils/asyncHandler";

class AuthController {
    login = asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.login(
            req.body.email,
            req.body.password,
        );

        res.json({
            success: true,
            data: result,
        });
    });

    me = asyncHandler(async (req:Request, res:Response) => {
        const user = await authService.me(req.user!.userId);

        res.json({
            success: true,
            data: user,
        });
    });
}

export default new AuthController();
