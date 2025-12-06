import DataUriParser from "datauri/parser.js";
import path from "path";

const getDataUri = (file) => {
  try {
    if (!file.buffer) {
      throw new Error("File buffer is undefined");
    }

    const parser = new DataUriParser();
    const extName = path.extname(file.originalname).toString();

    const result = parser.format(extName, file.buffer);

    return result;
  } catch (error) {
    console.error("getDataUri error:", error);
    throw error;
  }
};

export default getDataUri;
