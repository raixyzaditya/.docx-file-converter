import mongoose from "mongoose";
import express from "express";
import multer from "multer";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import cors from "cors"
import { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
mongoose.connect("mongodb://localhost:27017/scan_me").then(()=>console.log("connected to Scan_me db...")).catch((err)=>console.log(err));
app.use(express.json());
app.use(cors());

const send = multer({ dest: 'upload/' });

app.post('/uploads', send.single("input_file"), (req, res) => {
  const filepath = path.join(__dirname, req.file.path);
  const py = spawn("python", ["Scan.py", filepath]);
  console.log("file uploaded");

  let ans = "";

  py.stdout.on("data", (data) => {
    ans += data.toString();
  });

  py.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  py.on("close", (code) => {
    fs.unlinkSync(filepath); // delete original PDF
    try {
      const result = JSON.parse(ans);
      const wordFile = result.your_file;
      const wordPath = path.join(__dirname, "upload", wordFile);
      res.download(wordPath, (err) => {
        if (err) {
          console.error("Download error:", err);
          res.status(500).send("Failed to download Word file.");
        } else {
          // Optional: delete the Word file after download
          fs.unlinkSync(wordPath);
        }
      });
    } catch (error) {
      console.error("Parse error:", error);
      res.status(500).json({ message_err: `Error generating Word file: ${error}` });
    }
  });
});
app.listen(5000,()=>{
    console.log("Heelo aditya")
})