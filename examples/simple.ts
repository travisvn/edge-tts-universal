import { Communicate } from "../dist/index.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEXT = "Hello, world! This is a test of the new edge-tts Node.js library.";
const VOICE = "en-US-SteffanNeural";
const OUTPUT_FILE = path.join(__dirname, "test.mp3");

async function main() {
  const communicate = new Communicate(TEXT, { voice: VOICE });

  // The stream() method returns an async generator that yields audio chunks.
  const audioStream = communicate.stream();

  const buffers: Buffer[] = [];
  for await (const chunk of audioStream) {
    if (chunk.type === "audio" && chunk.data) {
      buffers.push(chunk.data);
    }
  }

  const finalBuffer = Buffer.concat(buffers);
  await fs.writeFile(OUTPUT_FILE, finalBuffer);

  console.log(`Audio saved to ${OUTPUT_FILE}`);
}

main().catch(console.error); 