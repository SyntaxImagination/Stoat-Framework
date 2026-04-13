/*
 **
 **    The General Helper file provides as much as possible resuable helper methods to ease the developers works
 **    Methods exported here are merged into _s.helpers.Helper, overriding stoatcore defaults where names match.
 **
 */

const { writeFileSync } = require("fs");
const path = require("path");

module.exports = {
      /**
       * Fix: stoatcore's writeBase64ToFile referenced `writeFileSync` and `path`
       * without importing them, and used the wrong variable name for the path parameter.
       */
      writeBase64ToFile: async (base64Data, pathToSaveAt, fileName = null) => {
            const imageData = base64Data.split(";base64,");
            const imageFormat = imageData[0].split("/");

            const photo = imageData[1];
            let format = imageFormat[1];

            switch (format) {
                  case "png":
                        format = ".png";
                        break;
                  case "jpeg":
                  case "jpg":
                        format = ".jpg";
                        break;
                  case "gif":
                        format = ".gif";
                        break;
                  case "pdf":
                        format = ".pdf";
                        break;
                  default:
                        format = `.${format}`;
            }

            if (!fileName) {
                  fileName = _s.helpers.Helper.generateRandomLetters(25).toUpperCase();
            }

            try {
                  writeFileSync(
                        path.join(pathToSaveAt, `${fileName}${format}`),
                        photo,
                        { encoding: "base64" }
                  );
                  return {
                        status: 1,
                        data: { name: `${fileName}${format}` },
                  };
            } catch (e) {
                  console.log(e);
                  return { status: 2 };
            }
      },
};