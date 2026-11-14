import fs from "fs";
import path from "path";

const imgPath = path.resolve("public/arche logo.jpeg");
console.log("Image path:", imgPath);
console.log("Exists:", fs.existsSync(imgPath));
const stats = fs.statSync(imgPath);
console.log("Size:", stats.size);
