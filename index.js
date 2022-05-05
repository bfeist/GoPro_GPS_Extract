const gpmfExtract = require("gpmf-extract");
const goproTelemetry = require(`gopro-telemetry`);
const fs = require("fs");
const util = require("util");
const { buildGPX, GarminBuilder } = require("gpx-builder");
const { Point } = require("gpx-builder/dist/builder/BaseBuilder/models");
const moment = require("moment");

const readdir = util.promisify(fs.readdir);

const goproVideoPath = "F:/JETT1-GOPRO/apr_23_eva3_matthew_c2/";

const outputPath = "F:/JETT1-GOPRO/apr_23_eva3_matthew_c2/";

(async () => {
  const dirListing = await readdir(goproVideoPath);
  const files = dirListing.filter((file) => file.endsWith(".MP4"));

  for (let y = 0; y < files.length; y++) {
    const filePath = `${goproVideoPath}${files[y]}`;
    const gpxFileName = files[y].split(".")[0] + ".gpx";
    const outputFilePath = `${outputPath}${gpxFileName}`;

    if (!fs.existsSync(outputFilePath)) {
      console.log(`Extracting GPMF data from ${files[y]}`);
      const res = await gpmfExtract(bufferAppender(filePath, 10 * 1024 * 1024));
      console.log("Converting binary to telemetry object");
      const telemetry = await goproTelemetry(res, {
        groupTimes: 1000,
        GPS5Fix: 2,
        timeIn: "GPS",
        stream: "GPS5",
      });
      const gpsData = telemetry["1"].streams.GPS5;
      const gpsPoints = [];

      console.log("Creating 1hz GPX track from extracted telemetry");
      for (let i = 0; i < gpsData.samples.length; i++) {
        try {
          const gpsItem = gpsData.samples[i];
          // if (gpsItem.date.getSeconds() !== lastDateSeconds) {
          const momentDate = moment(gpsItem.date.toISOString());

          // let correctedDate = momentDate.add(16, "minutes"); //correcting incorrect GoPro MAX clock
          // correctedDate = momentDate.add(8, "seconds");

          // let correctedDate = momentDate.subtract(7, "hours"); // Times coming out of the GoPro are off by 7 hours.

          const point = new Point(gpsItem.value[0], gpsItem.value[1], {
            ele: gpsItem.value[2],
            time: momentDate.toDate(),
          });
          gpsPoints.push(point);
        } catch (error) {
          console.log(error);
        }
      }

      const gpxData = new GarminBuilder();
      gpxData.setSegmentPoints(gpsPoints);

      const gpxString = buildGPX(gpxData.toObject());

      console.log("Writing file");
      fs.writeFileSync(outputFilePath, gpxString);
    } else {
      console.log(`${outputFilePath} already exists`);
    }
  }
  console.log("Finished.");
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
