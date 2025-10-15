import { db } from "../connectDB.js";


export const getAllDevices = async (req, res) => {
    const q = "SELECT * FROM devices";
      db.query(q, (err, data) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Devices database error" });
        }
        return res.json(data);
      });
}

export const getListDevices = (req, res) => {
  const q = "SELECT serial FROM devices";

  db.query(q, (err, data) => {
    if (err) {
      console.error("Error getAllDevices:", err);
      return res.status(500).json({ message: "Devices database error" });
    }
    const serials = data.map((row) => row.serial);

    return res.json(serials);
  });
};

export const getLogInfoBySerial = (req, res) => {
  const { serial } = req.params;

  const q = "SELECT * FROM hsi20_logs_info WHERE serial = ?";

  db.query(q, [serial], (err, rows) => {
    if (err) {
      console.error("Error getLogInfoBySerial:", err);
      return res.status(500).json({ message: "Device database error" });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }

    res.json(rows[0]); // vì mỗi serial chỉ có 1 dòng
  });
};

export const getAllErrorLogsBySerial = (req, res) => {
    const { serial } = req.params;

    // Check serial format
    if (!/^[a-zA-Z0-9_]+$/.test(serial)) {
        return res.status(400).json({ message: "Invalid serial format" });
    }

    const tableName = `error_code_logs_${serial}`;
    const sql = `SELECT * FROM \`${tableName}\``;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error("Error getAllErrorLogsBySerial:", err);
            return res.status(500).json({ message: "Server error" });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }

        res.json(rows);
    });
};

export const getEnergyDataBySerial = (req, res) => {
    const { serial, range } = req.params;

    if (!/^[a-zA-Z0-9_]+$/.test(serial)) {
        return res.status(400).json({ message: "Invalid serial format" });
    }

    const tableName = `cal_update_energy_${serial}`;
    let sql = "";
    let noteFilter = "";
    let limitDays = 0;

    switch (range) {
        case "7days":
            noteFilter = "day";
            limitDays = 7;
            break;
        case "14days":
            noteFilter = "day";
            limitDays = 14;
            break;
        case "30days":
            noteFilter = "day";
            limitDays = 30;
            break;
        case "12months":
            noteFilter = "month";
            limitDays = 12;
            break;
        case "all-time":
            noteFilter = "year";
            break;
        default:
            return res.status(400).json({ message: "Invalid range parameter" });
    }

    if (range === "all-time") {
        sql = `SELECT * FROM \`${tableName}\` WHERE note = ? ORDER BY date_time DESC`;
    } else if (range === "12months") {
        sql = `SELECT * FROM \`${tableName}\` WHERE note = ? ORDER BY date_time DESC LIMIT ${limitDays}`;
    } else {
        sql = `SELECT * FROM \`${tableName}\` WHERE note = ? ORDER BY date_time DESC LIMIT ${limitDays}`;
    }

    db.query(sql, [noteFilter], (err, rows) => {
        if (err) {
            console.error("Error getEnergyDataBySerial:", err);
            return res.status(500).json({ message: "Server error" });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }

        rows.reverse();

        res.json(rows);
    });
};