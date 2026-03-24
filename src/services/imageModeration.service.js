import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawn } from "child_process";

const CHECKPOINT_DIR = path.resolve(process.cwd(), "src/checkpoint");
const INFERENCE_SCRIPT = path.join(CHECKPOINT_DIR, "nsfw_inference.py");
const NSFW_THRESHOLD = Number(process.env.NSFW_THRESHOLD || 0.7);

const runPythonInference = (payload) =>
  new Promise((resolve, reject) => {
    const pythonBin = process.env.PYTHON_BIN || "python";
    const child = spawn(pythonBin, [INFERENCE_SCRIPT], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `NSFW inference failed (code ${code}). ${stderr || "No error output"}`,
          ),
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout || "{}");
        resolve(parsed);
      } catch {
        reject(new Error(`Invalid inference response: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });

const getFileExtension = (file) => {
  if (file?.mimetype) {
    if (file.mimetype.includes("png")) return "png";
    if (file.mimetype.includes("webp")) return "webp";
    if (file.mimetype.includes("gif")) return "gif";
  }
  return "jpg";
};

const buildFlags = (results) =>
  results
    .filter((item) => item.isSensitive)
    .map(
      (item) =>
        `sensitive_image_detected:${item.source}:nsfw_score=${Number(item.nsfwScore || 0).toFixed(4)}`,
    );

export const moderateImagesWithCheckpoint = async ({
  files = [],
  imageUrls = [],
  threshold = NSFW_THRESHOLD,
}) => {
  if ((!files || files.length === 0) && (!imageUrls || imageUrls.length === 0)) {
    return {
      isSensitive: false,
      flags: [],
      results: [],
    };
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "post-moderation-"));

  try {
    const localFiles = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const extension = getFileExtension(file);
      const filename = `upload-${index + 1}.${extension}`;
      const absolutePath = path.join(tmpDir, filename);

      await fs.writeFile(absolutePath, file.buffer);
      localFiles.push(absolutePath);
    }

    const inference = await runPythonInference({
      checkpointDir: CHECKPOINT_DIR,
      localFiles,
      imageUrls,
      threshold,
    });

    const results = Array.isArray(inference.results) ? inference.results : [];

    return {
      isSensitive: results.some((item) => item.isSensitive),
      flags: buildFlags(results),
      results,
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
};

export default {
  moderateImagesWithCheckpoint,
};
