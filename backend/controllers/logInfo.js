import { db } from "../connectDB.js";
import dayjs from "dayjs"


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

export const getLogsForChart = (req, res) => {
  const { serial } = req.params;
  const { start_time, end_time, parameter } = req.query;

  if (!serial) return res.status(400).json({ message: "Missing serial" });
  if (!parameter) return res.status(400).json({ message: "Missing parameter" });
  if (!start_time || !end_time)
    return res.status(400).json({ message: "Missing start_time or end_time" });

  if (!/^[a-zA-Z0-9_]+$/.test(serial))
    return res.status(400).json({ message: "Invalid serial format" });
  if (!/^[a-zA-Z0-9_]+$/.test(parameter))
    return res.status(400).json({ message: "Invalid parameter name" });

  const startFormatted = dayjs(start_time, "MM-DD-YYYY").startOf("day");
  const endFormatted = dayjs(end_time, "MM-DD-YYYY").endOf("day");

  const tableName = `logs_${serial}`;
  const MAX_POINTS = 1000;

  // Lấy toàn bộ dữ liệu trong khoảng (hoặc có thể limit để tránh quá tải)
  const sql = `
    SELECT date_time, ${parameter} AS value
    FROM \`${tableName}\`
    WHERE date_time BETWEEN ? AND ?
    ORDER BY date_time ASC
  `;

  db.query(sql, [startFormatted.format("YYYY-MM-DD HH:mm:ss"), endFormatted.format("YYYY-MM-DD HH:mm:ss")], (err, rows) => {
    if (err) {
      console.error("Error getLogsForChart:", err);
      if (err.code === "ER_NO_SUCH_TABLE") {
        return res.status(404).json({ message: `Table ${tableName} not found` });
      }
      if (err.code === "ER_BAD_FIELD_ERROR") {
        return res.status(400).json({ message: `Invalid parameter: ${parameter}` });
      }
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No data found in given range" });
    }

    // Tạo 1000 mốc thời gian chia đều
    const start = startFormatted.valueOf();
    const end = endFormatted.valueOf();
    const interval = (end - start) / (MAX_POINTS - 1);

    const data = [];
    let rowIndex = 0;

    for (let i = 0; i < MAX_POINTS; i++) {
      const targetTime = start + i * interval;

      // Dịch đến điểm gần nhất trong rows (vì rows đã được sort)
      while (
        rowIndex < rows.length - 1 &&
        dayjs(rows[rowIndex + 1].date_time).valueOf() < targetTime
      ) {
        rowIndex++;
      }

      const current = rows[rowIndex];
      const next = rows[rowIndex + 1];

      // Nếu có thể, nội suy nhẹ giữa 2 điểm
      let value = current?.value ?? 0;
      if (next) {
        const t1 = dayjs(current.date_time).valueOf();
        const t2 = dayjs(next.date_time).valueOf();
        if (t2 > t1) {
          const ratio = (targetTime - t1) / (t2 - t1);
          value = current.value + (next.value - current.value) * ratio;
        }
      }

      data.push({
        time: dayjs(targetTime).format("YYYY-MM-DD HH:mm:ss"),
        value: Number(value),
      });
    }

    res.json({
      serial,
      parameter,
      start: startFormatted.format("YYYY-MM-DD HH:mm:ss"),
      end: endFormatted.format("YYYY-MM-DD HH:mm:ss"),
      total_points: data.length,
      data,
    });
  });
};
