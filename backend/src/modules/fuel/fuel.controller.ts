import { Request, Response } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler";

import fuelService from "./fuel.service";

import { createFuelLogSchema } from "./fuel.validation";

class FuelController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const data = createFuelLogSchema.parse(req.body);

        const fuel = await fuelService.create(data);

        res.status(201).json({
            success: true,
            data: fuel,
        });
    });

    getAll = asyncHandler(async (_: Request, res: Response) => {
        const fuelLogs = await fuelService.getAll();

        res.json({
            success: true,
            data: fuelLogs,
        });
    });
}

export default new FuelController();
