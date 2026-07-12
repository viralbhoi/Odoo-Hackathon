import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { errorHandler } from "./common/middleware/errorHandler";
import { notFound } from "./common/middleware/notFound";

import routes from "./routes";


const app = express();

app.use(helmet());

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

app.use(cookieParser());

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
    })
);

app.use("/api/v1", routes);

app.use(notFound);

app.use(errorHandler);




export default app;
