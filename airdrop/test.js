let apiKey= "AIzaSyCzOAdVfUSllbeQlWmaEKSqXoHwKeIc2kk"
// let apiKey= "AIzaSyDPuvf4j9e8DxI3GycyHpTP--h_XEylSHs"

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: apiKey, // replace with your actual key
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });

  console.log(response.text);
}

await main();
