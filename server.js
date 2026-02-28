const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

const DB_FILE = "./db.json";

function readDB(){
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data){
  fs.writeFileSync(DB_FILE, JSON.stringify(data,null,2));
}

app.get("/", (req,res)=>{
  res.send("DLRS License Server Running");
});

app.post("/verify-license",(req,res)=>{

const {license_key, device_id} = req.body;
const db = readDB();

const record = db.licenses.find(l=>l.key===license_key);

if(!record)
  return res.json({status:"invalid"});

if(record.kill)
  return res.json({status:"killed"});

if(new Date() > new Date(record.expiry))
  return res.json({status:"expired"});

if(!record.active_devices.includes(device_id)){
  record.active_devices.push(device_id);
  writeDB(db);
}

res.json({status:"valid"});
});

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server started");
});
