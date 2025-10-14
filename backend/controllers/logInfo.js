import { db } from "../connectDB.js";


export const getAllDevices = async (req, res) => {
    // try {
    //     const [rows] = await db.query("SELECT * FROM devices");
    //     res.json(rows);
    // } catch (err) {
    //     console.error("Error getAllDevices: ", err);
    //     res.status(500).json({ message: "Server error" });
    // }


    const q = "SELECT * FROM devices";
      db.query(q, (err, data) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Devices database error" });
        }
        return res.json(data);
      });
}

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