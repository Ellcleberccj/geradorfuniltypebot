import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import generateRouter from "./generate.js";
import downloadRouter from "./download.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generateRouter);
router.use(downloadRouter);

export default router;
