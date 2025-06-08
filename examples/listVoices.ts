import { VoicesManager } from "../src";

async function main() {
  const voicesManager = await VoicesManager.create();

  // Find all English voices
  const voices = voicesManager.find({ Language: "en" });
  console.log("English voices:", voices.map(v => v.ShortName));

  // Find a specific voice
  const femaleUsVoices = voicesManager.find({ Gender: "Female", Locale: "en-US" });
  console.log("Female US voices:", femaleUsVoices.map(v => v.ShortName));
}

main().catch(console.error); 