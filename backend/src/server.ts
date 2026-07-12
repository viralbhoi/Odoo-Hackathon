import app from "./app";
import { env } from "./common/config/env";
import { logger } from "./common/logger/logger";

app.listen(env.PORT, () => {
    logger.info(
        `🚀 Server running on http://localhost:${env.PORT}`
    );
});