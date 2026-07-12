import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { IdParams } from "../../common/types/request.types";

import maintenanceService from "./maintenance.service";

import {
    createMaintenanceSchema,
    completeMaintenanceSchema,
} from "./maintenance.validation";

class MaintenanceController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const data = createMaintenanceSchema.parse(req.body);

        const maintenance = await maintenanceService.create(data);

        res.status(201).json({
            success: true,
            data: maintenance,
        });
    });

    getAll = asyncHandler(async (_: Request, res: Response) => {
        const maintenance = await maintenanceService.getAll();

        res.json({
            success: true,
            data: maintenance,
        });
    });

    complete = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const data = completeMaintenanceSchema.parse(req.body);

        const maintenance = await maintenanceService.complete(
            req.params.id,
            data,
        );

        res.json({
            success: true,
            data: maintenance,
        });
    });
}

export default new MaintenanceController();
