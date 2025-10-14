import express from "express";
import {
    getAllDevices, getLogInfoBySerial
} from "../controllers/logInfo.js"
const router = express.Router();

// GET all devices
router.get("/all", getAllDevices);

// GET /api/devices/:serial
router.get("/:serial", getLogInfoBySerial);
export default router;