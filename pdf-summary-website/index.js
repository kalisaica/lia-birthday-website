const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");
require("dotenv").config(); // Load .env file for environment variables

const app = express();
const PORT = 3000;

// OpenAI API Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your .env file contains OPENAI_API_KEY
});

// Middleware
app.use(fileUpload());

// Route to serve HTML upload page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Function to generate summary using OpenAI
async function generateSummary(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an assistant that summarizes text documents.",
        },
        {
          role: "user",
          content: `Please summarize the following text: ${text}`,
        },
      ],
      max_tokens: 150,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating summary:", error.message);
    throw new Error("Failed to generate summary.");
  }
}

// Handle file upload and summary generation
app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.pdfFile) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const pdfFile = req.files.pdfFile;

  try {
    const filePath = __dirname + "/" + pdfFile.name;
    await pdfFile.mv(filePath);

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const summary = await generateSummary(pdfData.text);

    fs.unlinkSync(filePath);

    res.json({ message: "File uploaded successfully!", summary });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "An error occurred while processing the file." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
