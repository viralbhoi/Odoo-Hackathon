import { Request, Response } from "express";
import dashboardService from "./dashboard.service";
import { asyncHandler } from "../../common/utils/asyncHandler";

class DashboardController {
    getDashboard = asyncHandler(async (req: Request, res: Response) => {
        const dashboard = await dashboardService.getDashboard(req.user!.role);

        res.json({
            success: true,
            data: dashboard,
        });
    });
}

export default new DashboardController();
