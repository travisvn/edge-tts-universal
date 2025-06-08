import { Communicate, SubMaker } from "../src";

const TEXT = "This is a test of the streaming functionality, with subtitles.";
const VOICE = "en-GB-SoniaNeural";

async function main() {
  const communicate = new Communicate(TEXT, { voice: VOICE });
  const subMaker = new SubMaker();

  for await (const chunk of communicate.stream()) {
    if (chunk.type === "audio" && chunk.data) {
      // Do something with the audio data, e.g., stream it to a client.
      // For this example, we'll just log its size.
      console.log(`Received audio chunk of size: ${chunk.data.length}`);
    } else if (chunk.type === "WordBoundary") {
      subMaker.feed(chunk);
    }
  }

  // Get the subtitles in SRT format.
  const srt = subMaker.getSrt();
  console.log("\nGenerated Subtitles (SRT):\n", srt);
}

main().catch(console.error); 