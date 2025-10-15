import express from "express";
import {
    getSettingsInfoBySerial, getSettingsHistoryBySerial, insertSystemSetting
} from "../controllers/setting.js"
const router = express.Router();

router.get("/:serial", getSettingsInfoBySerial);
router.get("/history/:serial", getSettingsHistoryBySerial);
router.post("/system", insertSystemSetting);

export default router