import multer from "multer";
import path from "path";
import fs from "fs";

// Set destination and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/assignments";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + file.fieldname + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    // Accept PDFs, docs, images (customize as needed)
    if (
      file.mimetype.startsWith("application/") ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

export default upload;


export const uploadFile = (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ filePath: req.file.path });
  });
}


export const uploadMultipleFiles = (req, res) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const filePaths = req.files.map(file => file.path);
    res.json({ filePaths });
  });
}
