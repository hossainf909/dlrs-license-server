const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { licenses: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.send("DLRS License Server Running");
});

app.post("/verify-license", (req, res) => {
  try {
    const { license_key, device_id } = req.body;
    const db = readDB();

    const record = db.licenses.find(l => l.key === license_key);

    if (!record)
      return res.json({ status: "invalid" });

    if (record.kill)
      return res.json({ status: "killed" });

    if (new Date() > new Date(record.expiry))
      return res.json({ status: "expired" });

    // 🔐 Device Binding Logic
    if (!record.bound_device) {
      // First time use → bind device
      record.bound_device = device_id;
      writeDB(db);
      return res.json({ status: "activated" });
    }

    if (record.bound_device !== device_id) {
      return res.json({ status: "different_device" });
    }

    res.json({ status: "valid" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "server_error" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
