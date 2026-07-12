import { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import tripService from "./trip.service";
import { createTripSchema } from "./trip.validation";
import { IdParams } from "../../common/types/request.types";

class TripController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const data = createTripSchema.parse(req.body);

        const trip = await tripService.create(data);

        res.status(201).json({
            success: true,
            data: trip,
        });
    });

    getAll = asyncHandler(async (_: Request, res: Response) => {
        const trips = await tripService.getAll();

        res.json({
            success: true,
            data: trips,
        });
    });

    dispatch = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const trip = await tripService.dispatch(req.params.id);

        res.json({
            success: true,
            message: "Trip dispatched successfully",
            data: trip,
        });
    });

    complete = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const trip = await tripService.complete(req.params.id, req.body);

        res.json({
            success: true,
            message: "Trip completed successfully",
            data: trip,
        });
    });

    cancel = asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const trip = await tripService.cancel(req.params.id);

        res.json({
            success: true,
            message: "Trip cancelled successfully",
            data: trip,
        });
    });
}

export default new TripController();
