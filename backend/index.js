const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:3001"],
  })
);

const formDataPath = path.join(__dirname, "formData.json");

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/submit-form", async (req, res) => {
  const formData = req.body;

  let existingData = [];
  try {
    existingData = JSON.parse(fs.readFileSync(formDataPath, "utf8"));
  } catch (error) {}

  existingData.push(formData);

  try {
    fs.writeFileSync(formDataPath, JSON.stringify(existingData, null, 2));
    console.log("Form data saved successfully.");

    // Send email with PDF attachment
    await sendEmail(formData);

    res.status(200).json({ message: "Form submitted successfully" });
  } catch (error) {
    console.error("Error writing data file or sending email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to send email with PDF attachment
async function sendEmail(formData) {
  const transporter = nodemailer.createTransport({
    service: "Mailtrap",
    auth: {
      token: "688f990b5b7cae22e1ed42d3224cbfa9"
    },
  });

  const mailOptions = {
    from: "ashishhb89@gmail.com",
    to: `${formData.email}`,
    subject: "Form Data",
    text: "Form Data",
    attachments: [
      {
        filename: "formData.pdf",
        content: await generatePDF(formData),
      },
    ],
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

// Function to generate a PDF from form data
async function generatePDF(formData) {
  const doc = new PDFDocument();
  const pdfBuffer = [];

  doc.on("data", (chunk) => {
    pdfBuffer.push(chunk);
  });

  doc.on("end", () => {
    return Buffer.from(pdfBuffer);
  });

  // Add PDF content here based on formData
  doc.text(`Full Name: ${formData.fullName}`);
  doc.text(`Email: ${formData.email}`);
  // Add more fields as needed

  doc.end();
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});