import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import driverService from "./driver.service";
import {
    createDriverSchema,
    renewLicenseSchema,
    updateDriverSchema,
} from "./driver.validation";
import { IdParams } from "../../common/types/request.types";

class DriverController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const data = createDriverSchema.parse(req.body);

        const driver = await driverService.create(data);

        res.status(201).json({
            success: true,
            data: driver,
        });
    });

    getAll = asyncHandler(async (_: Request, res: Response) => {
        const drivers = await driverService.getAll();

        res.json({
            success: true,
            data: drivers,
        });
    });

    getById = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const driver = await driverService.getById(req.params.id);

        res.json({
            success: true,
            data: driver,
        });
    });

    update = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const data = updateDriverSchema.parse(req.body);

        const driver = await driverService.update(req.params.id, data);

        res.json({
            success: true,
            data: driver,
        });
    });

    renewLicense = asyncHandler(
        async (req: Request<IdParams>, res: Response) => {
            const data = renewLicenseSchema.parse(req.body);

            const driver = await driverService.renewLicense(
                req.params.id,
                data,
            );

            res.json({
                success: true,
                data: driver,
            });
        },
    );

    suspend = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const driver = await driverService.suspend(req.params.id);

        res.json({
            success: true,
            data: driver,
        });
    });

    reinstate = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const driver = await driverService.reinstate(req.params.id);

        res.json({
            success: true,
            data: driver,
        });
    });

    delete = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        await driverService.delete(req.params.id);

        res.json({
            success: true,
            message: "Driver deleted successfully",
        });
    });
}

export default new DriverController();
