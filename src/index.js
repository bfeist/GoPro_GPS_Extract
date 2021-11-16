const gpmfExtract = require("gpmf-extract");
const goproTelemetry = require(`gopro-telemetry`);
const fs = require("fs");

// const file = fs.readFileSync('/Users/benfeist/Downloads/GS010021.MP4');

// gpmfExtract(file).then(extracted => {
//   goproTelemetry(extracted, {}, telemetry => {
//     fs.writeFileSync('output_path.json', JSON.stringify(telemetry));
//     console.log('Telemetry saved as JSON');
//   });
// })
// .catch(error => console.error(error));

goproVideoPath = "N:/Projects/NASA RiS4E/Field Data/2021/Raw/GoPro_MAX/";
outputPath = "N:/Projects/NASA RiS4E/Field Data/2021/Processed/360_processed/";

const dirListing = await fs.readdir(goproVideoPath);

(async () => {
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
