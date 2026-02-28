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

    // Device limit check
    if (!record.active_devices.includes(device_id)) {
      if (record.active_devices.length >= record.device_limit) {
        return res.json({ status: "device_limit_reached" });
      }

      record.active_devices.push(device_id);
      writeDB(db);
    }

    res.json({ status: "valid" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "server_error" });
  }
});
