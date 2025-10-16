import express from "express";
import {
    getAllDevices, getLogInfoBySerial, getListDevices,
    getAllErrorLogsBySerial, getEnergyDataBySerial, getLogsForChart
} from "../controllers/logInfo.js"
const router = express.Router();

// GET all devices
router.get("/all", getAllDevices);
router.get("/list", getListDevices);
router.get("/error-logs/:serial", getAllErrorLogsBySerial);
// GET /api/devices/:serial
router.get("/:serial", getLogInfoBySerial);
router.get("/energy/:serial/:range", getEnergyDataBySerial);
router.get("/logs/:serial", getLogsForChart);
export default router;