import {
  Input,
  ALL_FORMATS,
  BlobSource,
  Output,
  BufferTarget,
  Mp4OutputFormat,
  Conversion,
  QUALITY_MEDIUM,
} from "mediabunny";
import { UploadProgress } from "./quick-storage";

const MAX_VIDEO_SIZE = 2500;
let currentConversion: Conversion | null = null;
let currentIntervalId = -1;

export const compressFile = async (
  resource: File,
  { onProgress }: { onProgress: (progress: UploadProgress) => void }
): Promise<File> => {
  return new Promise(async (resolve, reject) => {
    clearInterval(currentIntervalId);
    await currentConversion?.cancel();

    try {
      // Create a new input from the resource
      const source = new BlobSource(resource);
      const input = new Input({
        source,
        formats: ALL_FORMATS, // Accept all formats
      });

      const fileSize = await source.getSize();

      // Define the output file
      const output = new Output({
        target: new BufferTarget(),
        format: new Mp4OutputFormat(),
      });

      // Initialize the conversion process
      currentConversion = await Conversion.init({
        input,
        output,
        video: {
          width: MAX_VIDEO_SIZE,
          bitrate: QUALITY_MEDIUM,
        },
      });

      // Keep track of progress
      let progress = 0;
      currentConversion.onProgress = (newProgress) => (progress = newProgress);

      const updateProgress = () => {
        onProgress({ percentage: progress * 100 });
      };

      // Update the progress indicator regularly
      currentIntervalId = window.setInterval(updateProgress, 1000 / 60);

      // Start the conversion process
      await currentConversion.execute();

      clearInterval(currentIntervalId);
      updateProgress();

      console.log(
        `Compressed video to ${((output.target.buffer!.byteLength / fileSize) * 100).toPrecision(3)}% of original size`
      );

      const blob = new Blob([output.target.buffer!], {
        type: output.format.mimeType,
      });
      const newFile = new File([blob], resource.name, {
        type: output.format.mimeType,
      });
      resolve(newFile);
    } catch (error) {
      console.error(error);

      await currentConversion?.cancel();
      clearInterval(currentIntervalId);
      reject(error);
    }
  });
};
