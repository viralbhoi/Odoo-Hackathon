import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import reportsService from "./reports.service";

class ReportsController {
    getFuelEfficiency = asyncHandler(async (_: Request, res: Response) => {
        const data = await reportsService.getFuelEfficiency();
        res.json({ success: true, data });
    });

    getOperationalCost = asyncHandler(async (_: Request, res: Response) => {
        const data = await reportsService.getOperationalCost();
        res.json({ success: true, data });
    });

    getVehicleRoi = asyncHandler(async (_: Request, res: Response) => {
        const data = await reportsService.getVehicleRoi();
        res.json({ success: true, data });
    });

    getMonthlyTrend = asyncHandler(async (_: Request, res: Response) => {
        const data = await reportsService.getMonthlyTrend();
        res.json({ success: true, data });
    });

    exportCsv = asyncHandler(async (req: Request, res: Response) => {
        const type = (req.query.type as string) || "trips";
        const { filename, content } = await reportsService.exportCsv(type);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(content);
    });
}

export default new ReportsController();
