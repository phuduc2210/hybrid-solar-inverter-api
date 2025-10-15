import { db } from "../connectDB.js";


export const getSettingsInfoBySerial = async (req, res) => {
    const { serial } = req.params;

    const q = "SELECT * FROM settings_info WHERE serial = ?";

    db.query(q, [serial], (err, rows) => {
        if (err) {
        console.error("Error get settings info:", err);
        return res.status(500).json({ message: "Device database error" });
        }

        if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "Device not found" });
        }

        res.json(rows[0]);
    });
}

export const getSettingsHistoryBySerial = async (req, res) => {
    const { serial } = req.params;

    const q = "SELECT * FROM settings_historys WHERE serial = ?";

    db.query(q, [serial], (err, rows) => {
        if (err) {
        console.error("Error get settings historys:", err);
        return res.status(500).json({ message: "Device database error" });
        }

        if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "Device not found" });
        }

        res.json(rows);
    });
}


export const insertSystemSetting = (req, res) => {
  const { serial, name } = req.body;
  let { value } = req.body;

  if (!serial || !name) {
    return res.status(400).json({ message: "Missing serial or name" });
  }

  switch (name) {
    case "wf_rb":
    case "sync":
      value = 1;
      break;
    case "zr_ept":
      if (value !== 0 && value !== 1 && value !== "0" && value !== "1") {
        return res.status(400).json({ message: "Invalid value for zr_ept (must be 0 or 1)" });
      }
      break;
    case "period":
    case "cur_lim":
    case "dis_cur_lim":
    case "bst_vol":
    case "batt_uv":
    case "num_bat":
    case "run_md":
    case "grid_freq":
    case "grid_vol":
      if (!value) {
        return res.status(400).json({ message: "Missing value for period" });
      }
      break;
    default:
      return res.status(400).json({ message: "Invalid name field" });
  }
  const now = new Date();
  const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const sql = "INSERT INTO settings_temp (serial, name, value, time) VALUES (?, ?, ?, ?)";

  db.query(sql, [serial, name, value, formattedTime], (err, result) => {
    if (err) {
      console.error("Error insertSetting:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({
      message: "Setting inserted successfully",
      data: { serial, name, value, time: formattedTime },
    });
  });
};