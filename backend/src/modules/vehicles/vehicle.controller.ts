import { Request, Response } from "express";
import vehicleService from "./vehicle.service";
import { asyncHandler } from "../../common/utils/asyncHandler";

interface IdParams {
    id: string;
}

class VehicleController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const vehicle = await vehicleService.create(req.body);

        res.status(201).json({
            success: true,
            data: vehicle,
        });
    });

    getAll = asyncHandler(async (_: Request, res: Response) => {
        const vehicles = await vehicleService.getAll();

        res.json({
            success: true,
            data: vehicles,
        });
    });

    getById = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const vehicle = await vehicleService.getById(req.params.id);

        res.json({
            success: true,
            data: vehicle,
        });
    });

    delete = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        await vehicleService.delete(req.params.id);

        res.json({
            success: true,
            message: "Vehicle deleted successfully",
        });
    });
}

export default new VehicleController();
