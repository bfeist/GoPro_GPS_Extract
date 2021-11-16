const gpmfExtract = require("gpmf-extract");
const goproTelemetry = require(`gopro-telemetry`);
const fs = require("fs");
const util = require("util");

const readdir = util.promisify(fs.readdir);

const goproVideoPath = "N:/Projects/NASA RiS4E/Field Data/2021/Raw/GoPro_MAX/";

const outputPath =
  "N:/Projects/NASA RiS4E/Field Data/2021/Processed/360_processed/";

(async () => {
  const dirListing = await readdir(goproVideoPath);
  const files = dirListing.filter((file) => file.endsWith(".360"));

  const largeFilePath =
    "N:/Projects/NASA RiS4E/Field Data/2021/Raw/GoPro_MAX/GS010005.360";
  console.log("Extracting GPMF data from GoPro video");
  const res = await gpmfExtract(
    bufferAppender(largeFilePath, 10 * 1024 * 1024)
  );
  const telemetry = await goproTelemetry(res, {});
  console.log("Saving Telemetry as JSON");
  fs.writeFileSync("output_path.json", JSON.stringify(telemetry));
  console.log("Done");
})();

function bufferAppender(path, chunkSize) {
  return function (mp4boxFile) {
    var stream = fs.createReadStream(path, { highWaterMark: chunkSize });
    var bytesRead = 0;
    stream.on("end", () => {
      mp4boxFile.flush();
    });
    stream.on("data", (chunk) => {
      var arrayBuffer = new Uint8Array(chunk).buffer;
      arrayBuffer.fileStart = bytesRead;
      mp4boxFile.appendBuffer(arrayBuffer);
      bytesRead += chunk.length;
    });
    stream.resume();
  };
}
