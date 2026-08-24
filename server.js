import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";

import admin from "firebase-admin";
import Stripe from "stripe";
import nodemailer from "nodemailer";

import WebSocket from "ws";
import expressWs from "express-ws";

const bookingEmailTransport = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, "")
      }
    })
  : null;
const bookingAdminEmail = process.env.BOOKING_ADMIN_EMAIL || "zak.francillon@gmail.com";
const bookingSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER;

async function sendBookingEmail({ to, subject, html }) {
  if (process.env.BREVO_API_KEY && bookingSenderEmail) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Pro Driver Medicals", email: bookingSenderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo email API returned ${response.status}: ${errorBody}`);
    }
    return response.json();
  }

  if (bookingEmailTransport) {
    return bookingEmailTransport.sendMail({
      to,
      from: process.env.GMAIL_USER,
      subject,
      html
    });
  }

  throw new Error("No booking email provider is configured");
}

const app = express();
app.use(express.static("public"));



// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://localhost:5501",
  "http://127.0.0.1:5501",
  "https://oscereal-706d4.web.app",
  "https://pro-driver-medicals-uk.web.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));












//------Whisper:--------

import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const originalExt = path.extname(file.originalname || "");
    const mimeExt =
      file.mimetype === "audio/webm" ? ".webm" :
      file.mimetype === "audio/mp4" ? ".mp4" :
      file.mimetype === "audio/mpeg" ? ".mp3" :
      file.mimetype === "audio/wav" ? ".wav" :
      file.mimetype === "audio/ogg" ? ".ogg" :
      "";
    const ext = originalExt || mimeExt || ".webm";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage });
const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null;

function looksSuspiciousForEnglish(text = "") {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const cyrillicMatches = trimmed.match(/[\u0400-\u04FF]/g) || [];
  const latinMatches = trimmed.match(/[A-Za-z]/g) || [];

  return cyrillicMatches.length > 0 && cyrillicMatches.length > latinMatches.length;
}

function normalizeTranscriptText(text = "") {
  return String(text || "").trim();
}

app.post("/api/transcribe", upload.single("file"), async (req, res) => {
  if (!openai) {
    return res.status(503).json({ error: "Transcription is not configured." });
  }

  try {
    console.log("📥 Incoming request to /api/transcribe");

    if (!req.file) {
      console.error("❌ No file received");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📦 File received:", req.file.path);
    console.log("📦 File info:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      filename: req.file.filename
    });

    let transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "gpt-4o-transcribe",
      language: "en",
      temperature: 0
    });

    let transcriptText = normalizeTranscriptText(transcription.text);

    if (looksSuspiciousForEnglish(transcriptText)) {
      console.warn("Suspicious non-English transcript detected, retrying with whisper-1 English prompt");
      transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-1",
        language: "en",
        prompt: "Return only the spoken words in English. If nothing is said, return an empty transcript."
      });
      transcriptText = normalizeTranscriptText(transcription.text);
    }

    console.log("Transcription:", transcriptText || "[empty transcript]");

    res.json({ text: transcriptText });

    fs.unlinkSync(req.file.path); // cleanup

  } catch (err) {
    console.error("❌ Transcription error:", err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "transcription failed" });
  }
});









/*
expressWs(app);

app.ws("/deepgram", (clientSocket) => {
  const dgSocket = new WebSocket(
    "wss://api.deepgram.com/v1/listen?punctuate=true&encoding=linear16&sample_rate=16000",
    {
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      },
    }
  );

  clientSocket.on("message", (msg) => {
    if (dgSocket.readyState === WebSocket.OPEN) dgSocket.send(msg);
  });

  dgSocket.on("message", (data) => clientSocket.send(data.toString()));

  dgSocket.on("close", () => clientSocket.close());
  dgSocket.on("error", () => clientSocket.close());
});
*/






/*
// ---------------- DEEPGRAM TOKEN ----------------

expressWs(app);

app.ws("/deepgram", (clientSocket) => {
  const dgSocket = new WebSocket(
"wss://api.deepgram.com/v1/listen?punctuate=true",
    {
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      },
    }
  );

  // Forward audio from browser → Deepgram
  clientSocket.on("message", (msg) => {
    if (dgSocket.readyState === WebSocket.OPEN) dgSocket.send(msg);
  });

  // Send transcript back to browser
  dgSocket.on("message", (data) => clientSocket.send(data.toString()));

  dgSocket.on("close", () => clientSocket.close());
  dgSocket.on("error", () => clientSocket.close());
});
*/













app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("✅ Stripe event received:", event.type);

    // ✅ THIS IS THE IMPORTANT CHANGE
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;

      console.log("💰 Subscription payment succeeded for:", customerEmail);

      try {
        const snapshot = await admin
          .firestore()
          .collection("users")
          .where("email", "==", customerEmail)
          .get();

        if (snapshot.empty) {
          console.log("⚠️ No matching user found in Firestore");
        }

        snapshot.forEach(doc => {
          doc.ref.update({
            plan: "pro",
            subscriptionStatus: "active"
          });
        });

        console.log("🔥 Firestore updated successfully");
      } catch (err) {
        console.error("❌ Firestore update error:", err);
      }
    }




if (event.type === "customer.subscription.deleted") {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  const customer = await stripe.customers.retrieve(customerId);
  const email = customer.email;

  console.log("❌ Subscription cancelled for:", email);

  const snapshot = await admin
    .firestore()
    .collection("users")
    .where("email", "==", email)
    .get();

  snapshot.forEach(doc => {
    doc.ref.update({
      plan: "free",
      subscriptionStatus: "cancelled"
    });
  });
}









    res.json({ received: true });
  }
);

app.post(
  "/api/motor-medicals-stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!motorMedicalsStripe || !process.env.MOTOR_MEDICALS_STRIPE_WEBHOOK_SECRET) {
      return res.status(503).send("Pro Driver Medicals payments are not configured");
    }
    let event;
    try {
      event = motorMedicalsStripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.MOTOR_MEDICALS_STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("❌ Pro Driver Medicals webhook verification failed:", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === "checkout.session.completed" && event.data.object.metadata?.bookingType === "driver-medical") {
      try {
        if (event.data.object.payment_status !== "unpaid") {
          await confirmPaidAppointment(event.data.object);
        }
      } catch (bookingError) {
        console.error("❌ Paid Pro Driver Medicals appointment confirmation failed:", bookingError);
        return res.status(500).json({ error: "Payment received but appointment confirmation failed" });
      }
    }

    res.json({ received: true });
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ---------------- CHAT GPT API ---------------- //





app.post("/api/oscetrial", async (req, res) => {
  const { input, previousquestion, response_question } = req.body;

  try {
   /* const completeSentence = async (responseText) => {
      // Loop until we have a sentence-ending punctuation mark
      while (!(responseText.endsWith('.') || responseText.endsWith('!') || responseText.endsWith('?'))) {
        // Make a request to complete the sentence
        const additionalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo", // or another model, like "gpt-4"
            messages: [
              { role: "system", content: "you're Marc, a 31-year-old male, experiencing constant severe chest pain." },
              { role: "user", content: `Previous Dr question: ${previousquestion || "N/A"}\nYour previous response: ${response_question || "N/A"}\nNew Dr question: ${input}\nMarc's answer:`},
            ],
            temperature: 0.1,
            max_tokens: 20, // Allow a bit more tokens for completion
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
          }),
        });

        const data = await additionalResponse.json();
        responseText += ' ' + data.choices[0].message.content.trim(); // Add the extra tokens
      }
      return responseText.trim();
    };
*/
    // Initial request to OpenAI 
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", //gpt-4o-mini
        messages: [
          { role: "system", content: "you're Marc, a 31-year-old male, experiencing constant severe chest pain. You're in a consultation room & the Dr is asking you questions. Answer as Marc be minimal max 1 sentence" },
              { role: "user", content: `Previous Dr question: ${previousquestion || "N/A"}\nYour previous response: ${response_question || "N/A"}\nNew Dr question: ${input}\nMarc's answer:`},        ],
        temperature: 0.1,
        max_tokens: 25,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    const data = await response.json();
    res.json({ content: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to connect to OpenAI" });
  }
});














app.get("/api/history", verifyFirebaseUser, async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("users")
      .doc(req.uid)
      .collection("history")
      .orderBy("createdAt", "desc")
      .get();

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});














app.post("/api/TUTOR2ndcase", verifyFirebaseUser, async (req, res) => {
  console.log("🚀 TUTOR2ndcase endpoint hit");
  console.log("📦 BODY:", req.body); // 👈 ADD THIS

  const { input, sessionId, endSession } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId required" });
  }

  const db = admin.firestore();
  const docRef = db.collection("conversations").doc(sessionId);

  try {

    // =========================
    // 🛑 END SESSION (EVALUATION)
    // =========================
    if (endSession) {
      console.log("🛑 Ending session:", sessionId);

      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(400).json({ error: "No session found" });
      }

      const messages = doc.data().messages || [];
      const transcript = messages
        .filter((message) => message && (message.role === "user" || message.role === "assistant"))
        .map((message) => `${message.role === "user" ? "Candidate" : "Interviewer"}: ${String(message.content || "").trim()}`)
        .join("\n\n");

      const evaluationMessages = [
        {
          role: "system",
content: `


You are a harsh + strict UK medical school admissions assessor.

You are assessing a candidate’s response to "Why Medicine?" and related motivation questions.

Your goal is to provide a HARSH, STRUCTURED, and HIGHLY ACTIONABLE evaluation.

========================
MARKING CRITERIA (Total = 10)
========================

1. Motivation & Insight into Medicine (0–3)
- 0 = Vague, generic, or superficial reasons (e.g. "help people", "like science") with no clear explanation of why medicine specifically
- 1 = Some insight shown but lacks depth, specificity, or clear reasoning for choosing medicine over other careers
- 2 = Clear and thoughtful motivation with some explanation of why medicine appeals, though insight may not be fully developed or nuanced
- 3 = Deep, personal, and well-articulated motivation with clear reasoning for choosing medicine specifically, demonstrating insight into both the scientific and human aspects of the role

2. Evidence & Experience (0–2)
- 0 = No relevant examples or experiences used to support motivation
- 1 = Examples are present but are either vague, descriptive rather than reflective, or not clearly linked back to motivation for medicine
- 2 = Strong, specific examples (e.g. work experience, volunteering, personal experiences) that are clearly explained and explicitly linked to the candidate’s motivation and understanding of medicine

3. Understanding of the Medical Profession (0–2)
- 0 = Little to no understanding of what being a doctor involves, or an unrealistic/overly idealised view
- 1 = Basic awareness of the role (e.g. mentions patients, teamwork, or general responsibilities) but lacks depth or realism
- 2 = Realistic and developed understanding of the profession, including aspects such as ethical responsibility, patient-centred care, teamwork (MDT), pressures of the NHS, and lifelong learning

4. Communication & Structure (0–2)
- 0 = Disorganised, unclear, or difficult to follow; ideas are poorly expressed or disconnected
- 1 = Some structure is evident but may include repetition, lack of clarity, or weak transitions between ideas
- 2 = Clear, fluent, and logically structured response with well-connected ideas and a coherent progression (e.g. motivation → experience → reflection)

5. Authenticity & Reflection (0–1)
- 0 = Rehearsed, cliché, or superficial response with little evidence of personal reflection or genuine insight
- 1 = Genuine and personal response that shows reflection on experiences, including what was learned and how it influenced the decision to pursue medicine


========================

SCORING GUIDANCE:
- Don't be afraid to give low scores
- 9–10 only for exceptional depth, insight, and clarity
- Penalise clichés and vague statements
- Reward reflection and specific examples

========================

OUTPUT FORMAT (STRICT):

Score: X/10

Breakdown:
- Motivation & Insight: X/3
- Evidence & Experience: X/2
- Understanding of Role: X/2
- Communication: X/2
- Authenticity: X/1

Overall:
[2–3 sentences: balanced, constructive, realistic]

Strengths:
- [Specific strength with example]
- [Specific strength with example]
- [Specific strength with example]

Improvements:
- [Specific actionable improvement]
- [Specific actionable improvement]
- [Specific actionable improvement]
- [Specific actionable improvement]

Cliché Check:
- [List any clichés used OR say "No major clichés detected"]

Top 10% Candidate Insight:
[Briefly explain what a top-tier candidate would have done differently]

Model Advice:
[Rewrite 1–2 sentences of their answer to demonstrate a stronger version]

Confidence: High / Medium / Low
(based on how much detail the candidate provided)
`
        },
        {
          role: "user",
          content: `Evaluate the candidate's "Why Medicine?" interview using ONLY the transcript below.

Return ONLY the strict evaluation format from the system prompt.
Do not continue the interview.
Do not thank the candidate.
Do not end the conversation politely.
Do not ask follow-up questions.
If the transcript is weak or sparse, still provide a score, breakdown, strengths, improvements, cliche check, top 10% insight, model advice, and confidence.

Transcript:
${transcript || "No transcript was recorded."}`
        }
      ];

      let evaluation;
      let score;

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: evaluationMessages,
            temperature: 0.3,
            max_tokens: 4000
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(" OpenAI API error:", response.status, errorText);
          return res.status(500).json({ error: "Failed to generate evaluation" });
        }

        const data = await response.json();
        evaluation = data.choices[0].message.content.trim();

        console.log(" Generated evaluation:", evaluation);

      // Extract score from evaluation text
      const scoreMatch = evaluation.match(/Score:\s*(\d+)/);
      score = scoreMatch ? parseInt(scoreMatch[1]) : null;

      console.log(" Extracted score:", score);
      } catch (error) {
        console.error(" Evaluation generation error:", error);
        return res.status(500).json({ error: "Failed to generate evaluation" });
      }

      try {
        // Save to user's history
        console.log("Saving evaluation to history...");
        await admin.firestore().collection("users").doc(doc.data().userId).collection("history").add({
          sessionId,
          evaluation,
          score,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAtReadable: new Date().toISOString()
        });

        console.log("Evaluation saved to history");

        await docRef.update({
          evaluation,
          completed: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log("Session marked as completed");
        return res.json({ evaluation });
      } catch (error) {
        console.error("Error saving evaluation:", error);
        return res.status(500).json({ error: "Failed to save evaluation" });
      }


    }

    // =========================
    // 💬 NORMAL INTERVIEW FLOW
    // =========================

    const doc = await docRef.get();

    let messages;

    if (!doc.exists) {
      messages = [
        {
          role: "system",
          content: `
You are a strict + severe unhappy UK medical school interviewer.

Your goals:
- Identify weak answers
- Probe deeper
- Test insight and reflection

Follow-up strategy:
- If answer is vague → ask for SPECIFIC example
- If answer lacks insight → ask "why does that matter?"
- If answer lacks understanding → ask about NHS / ethics / role of doctor
- If answer is strong → challenge further ("What would you find difficult about this?")

Rules:
- One question at a time (make them hard)
- Keep it sharp, concise and probing
- No feedback
- No praise
- Respond naturally
`
        }
      ];
    } else {
      messages = doc.data().messages || [];
    }

    messages.push({
      role: "user",
      content: input
    });
/*
    const MAX_MESSAGES = 12;
    if (messages.length > MAX_MESSAGES) {
      messages = [messages[0], ...messages.slice(-MAX_MESSAGES)];
    }
*/
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        max_tokens: 80
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    messages.push({
      role: "assistant",
      content: reply
    });

    await docRef.set({
      messages,
      userId: req.uid, // 👈 Stores UserID in conversation
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ content: reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});














app.post("/api/3rdcase", async (req, res) => {
  const { input, previousquestion, response_question } = req.body;

  try {
  /*  
    const completeSentence = async (responseText) => {
      // Loop until we have a sentence-ending punctuation mark
      while (!(responseText.endsWith('.') || responseText.endsWith('!') || responseText.endsWith('?'))) {
        // Make a request to complete the sentence
        const additionalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo", // or another model, like "gpt-4"
            messages: [
              { role: "system", content: "you're Daniel, a 33 yr old male. with a worsening cough over last 6 weeks associated with pleuritic Rt chest pain + fever. You're in a consultation room & the Dr is asking you questions. Answer as Daniel" },
              { role: "user", content: `Previous Dr question: ${previousquestion || "N/A"}
                                          Your previous response: ${response_question || "N/A"}
                                          New Dr question: ${input}
                                          Daniel's answer: ${responseText}` },
            ],
            temperature: 0.1,
            max_tokens: 20, // Allow a bit more tokens for completion
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
          }),
        });

        const data = await additionalResponse.json();
        responseText += ' ' + data.choices[0].message.content.trim(); // Add the extra tokens
      }
      return responseText.trim();
    };
*/
    // Initial request to OpenAI
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", //gpt-4o-mini
        messages: [
          { role: "system", content: "you're Daniel, a 33 yr old male. with a worsening cough over last 6 weeks associated with pleuritic Rt chest pain + fever. You're in a consultation room & the Dr is asking you questions. Answer as Daniel be minimal max 1 sentence" },
          { role: "user", content: `Previous Dr question: ${previousquestion || "N/A"}
                                    Your previous response: ${response_question || "N/A"}
                                    New Dr question: ${input}
                                    Daniel's answer:` },
        ],
        temperature: 0.1,
        max_tokens: 25,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    const data = await response.json();
    res.json({ content: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to connect to OpenAI" });
  }
});












app.post("/api/4thcase", async (req, res) => {
  const { input, previousquestion, response_question } = req.body;

  try {
/*const completeSentence = async (responseText) => {
      // Loop until we have a sentence-ending punctuation mark
      while (!(responseText.endsWith('.') || responseText.endsWith('!') || responseText.endsWith('?'))) {
        // Make a request to complete the sentence
        const additionalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo", // or another model, like "gpt-4"
            messages: [
              { role: "system", content: "you're John, a 31 year old male. with new right sided arm + leg weakness over last 3 hrs with facial droop + slurred speech. You're in a consultation room & the Dr is asking you questions. Answer as John" },
              { role: "user", content: `Previous Dr question: ${previousquestion || "N/A"}
                                          Your previous response: ${response_question || "N/A"}
                                          New Dr question: ${input}
                                          John's answer: ${responseText}` },
            ],
            temperature: 0.1,
            max_tokens: 20, // Allow a bit more tokens for completion
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
          }),
        });

        const data = await additionalResponse.json();
        responseText += ' ' + data.choices[0].message.content.trim(); // Add the extra tokens
      }
      return responseText.trim();
    };
*/
    // Initial request to OpenAI

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", //gpt-4o-mini
        messages: [
          { role: "system", content: "you're John, a 31 year old male. with new right sided arm + leg weakness over last 3 hrs with facial droop + slurred speech. You're in a consultation room & the Dr is asking you questions. Answer as John be minimal max 1 sentence" },
          { role: "user", content: `Previous Dr question: ${previousquestion || "N/A"}
                                    Your previous response: ${response_question || "N/A"}
                                    New Dr question: ${input}
                                    John's answer:` },
        ],
        temperature: 0.1,
        max_tokens: 25,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    const data = await response.json();
    res.json({ content: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to connect to OpenAI" });
  }
});









app.post("/api/5thcase", async (req, res) => {
  const { input, previousquestion, response_question } = req.body;

  try {

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", //gpt-4o-mini
        messages: [
          { role: "system", content: "you're Greg, a 56 yr old with new shortness of breath. You're struggling to breath. You're in a consultation room & the Dr is asking you questions. Answer as Greg be minimal max 1 sentence" },
          { role: "user", content: `Previous Dr question: ${previousquestion || "N/A"}
                                    Your previous response: ${response_question || "N/A"}
                                    New Dr question: ${input}
                                    Greg's answer:` },
        ],
        temperature: 0.1,
        max_tokens: 25,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    const data = await response.json();
    res.json({ content: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to connect to OpenAI" });
  }
});










app.post("/api/6thcase", async (req, res) => {
  const { input, previousquestion, response_question } = req.body;

  try {

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", //gpt-4o-mini
        messages: [
          { role: "system", content: "you're Jon, a 30 yr old with new central abdominal pain. You're in a consultation room & the Dr is asking you questions (Dx is appendicitis). Answer as Jon be minimal max 1 sentence" },
          { role: "user", content: `Previous Dr question: ${previousquestion || "N/A"}
                                    Your previous response: ${response_question || "N/A"}
                                    New Dr question: ${input}
                                    Jon's answer:` },
        ],
        temperature: 0.1,
        max_tokens: 25,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    const data = await response.json();
    res.json({ content: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to connect to OpenAI" });
  }
});







// ---------------- ELEVENLABS ---------------- //


/*
app.post("/api/voicezak", async (req, res) => {
  const { text, voiceId } = req.body;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs API error:", errText);
      return res.status(response.status).send(errText);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error("Error contacting ElevenLabs:", error);
    res.status(500).json({ error: "Failed to fetch from ElevenLabs" });
  }
});

*/



app.post("/api/voicezak", async (req, res) => {
  const { text, voiceId } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid or missing text" });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs API error:", errText);
      return res.status(response.status).send(errText);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error("Error contacting ElevenLabs:", error);
    res.status(500).json({ error: "Failed to fetch from ElevenLabs" });
  }
});





//stripe CARD PAYMENTS////////////////////////////////////


const stripe = process.env.STRIPE_SECRET_KEY?.startsWith("sk_")
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const motorMedicalsStripe = process.env.MOTOR_MEDICALS_STRIPE_SECRET_KEY?.startsWith("sk_")
  ? new Stripe(process.env.MOTOR_MEDICALS_STRIPE_SECRET_KEY)
  : null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  });
}



async function verifyFirebaseUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (err) {
  console.error("❌ Token error:", err);
  res.status(401).json({ error: "Invalid token" });
}
}





app.post("/api/create-checkout-session", verifyFirebaseUser, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: req.email,
      line_items: [
        {
          price: "price_1T157PLCGle4gqnNrr23raj5", // Stripe price ID
          quantity: 1
        }
      ],
      success_url: "https://oscereal-706d4.web.app/webpages/logins/successfulpay.html",
      cancel_url: "https://oscereal-706d4.web.app/webpages/logins/profile.html"
    });

    res.json({ url: session.url });
  /*} catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }*/
} catch (err) {
  console.error("Stripe session error:", err);
  res.status(500).json({ error: err.message });
}

});






app.post("/api/create-portal-session", verifyFirebaseUser, async (req, res) => {
  try {
    const customers = await stripe.customers.list({
      email: req.email,
      limit: 1,
    });

    if (!customers.data.length) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: "https://oscereal-706d4.web.app/webpages/logins/profile.html",
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error("Portal session error:", err);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});






// Delete feedback endpoint
app.delete("/api/history/:id", verifyFirebaseUser, async (req, res) => {
  console.log("DELETE route hit for ID:", req.params.id);
  console.log("User UID:", req.uid);
  
  try {
    const { id } = req.params;
    const db = admin.firestore();
    
    // Get the user's history collection and delete the specific document
    const historyRef = db.collection("users").doc(req.uid).collection("history").doc(id);
    
    const doc = await historyRef.get();
    if (!doc.exists) {
      console.log("Document not found:", id);
      return res.status(404).json({ error: "Feedback entry not found" });
    }
    
    await historyRef.delete();
    console.log("Document deleted successfully:", id);
    
    res.json({ success: true, message: "Feedback entry deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete feedback entry" });
  }
});

console.log("DELETE route registered: /api/history/:id");

// ---------------- APPOINTMENT BOOKING SYSTEM ---------------- //

function appointmentTimeSlots() {
  const slots = [];
  for (let minute = 1110; minute <= 1290; minute += 15) {
    const hour = Math.floor(minute / 60);
    const minutes = minute % 60;
    slots.push(`${hour - 12}:${String(minutes).padStart(2, "0")}pm`);
  }
  return slots;
}

function dateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function londonNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute)
  };
}

function dateFromKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function displayAppointmentDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || "");
}

function calendarDateLabel(value) {
  const date = dateFromKey(value);
  const day = date.getUTCDate();
  const remainder = day % 100;
  const suffix = remainder >= 11 && remainder <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th");
  const weekday = date.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short" });
  const month = date.toLocaleDateString("en-GB", { timeZone: "UTC", month: "short" });
  return `${weekday} ${day}${suffix} ${month}`;
}

function timeSlotMinutes(time) {
  const match = /^(\d{1,2}):(\d{2})(am|pm)$/.exec(time);
  if (!match) return NaN;
  let hour = Number(match[1]) % 12;
  if (match[3] === "pm") hour += 12;
  return hour * 60 + Number(match[2]);
}

function isFutureSlot(date, time, now = londonNow()) {
  return date > now.date || (date === now.date && timeSlotMinutes(time) > now.minutes);
}

function isBookableAppointment(date, time) {
  const appointmentDate = dateFromKey(date);
  if (Number.isNaN(appointmentDate.getTime()) || appointmentDate.getUTCDay() !== 3) return false;

  const now = londonNow();
  const lastBookableDate = dateFromKey(now.date);
  lastBookableDate.setUTCDate(lastBookableDate.getUTCDate() + 56);

  return date <= dateKey(lastBookableDate) && appointmentTimeSlots().includes(time) && isFutureSlot(date, time, now);
}

// Get available dates for the calendar
app.get("/api/available-dates", async (req, res) => {
  try {
    const db = admin.firestore();
    const appointmentsRef = db.collection("appointments");
    const snapshot = await appointmentsRef.get();
    
    const bookedSlotsByDate = new Map();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!appointmentBlocksSlot(data)) return;
      const bookedSlots = bookedSlotsByDate.get(data.date) || new Set();
      bookedSlots.add(data.time);
      bookedSlotsByDate.set(data.date, bookedSlots);
    });
    
    // Generate the next 8 Wednesday clinics.
    const dates = [];
    const now = londonNow();
    let nextWednesday = dateFromKey(now.date);
    while (nextWednesday.getUTCDay() !== 3) {
      nextWednesday.setUTCDate(nextWednesday.getUTCDate() + 1);
    }
    // After the final clinic slot has begun, start with next week's Wednesday.
    if (dateKey(nextWednesday) === now.date && now.minutes >= 1290) {
      nextWednesday.setUTCDate(nextWednesday.getUTCDate() + 7);
    }
    
    for (let i = 0; i < 8; i++) {
      const day = new Date(nextWednesday);
      day.setUTCDate(day.getUTCDate() + i * 7);
      const dateStr = dateKey(day);
      const futureSlots = appointmentTimeSlots().filter(time => isFutureSlot(dateStr, time, now));
      const bookedSlots = bookedSlotsByDate.get(dateStr) || new Set();
      dates.push({
        date: dateStr,
        label: calendarDateLabel(dateStr),
        available: futureSlots.some(time => !bookedSlots.has(time))
      });
    }
    
    res.json({ dates });
  } catch (err) {
    console.error("Error fetching available dates:", err);
    res.status(500).json({ error: "Failed to fetch available dates" });
  }
});

// Get available time slots for a specific date
app.get("/api/available-slots/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const db = admin.firestore();
    const appointmentsRef = db.collection("appointments");
    const snapshot = await appointmentsRef.where("date", "==", date).get();
    
    const bookedSlots = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!appointmentBlocksSlot(data)) return;
      bookedSlots.add(data.time);
    });
    
    const now = londonNow();
    const slots = appointmentTimeSlots().map(time => ({
      time,
      available: isFutureSlot(date, time, now) && !bookedSlots.has(time)
    }));
    
    res.json({ slots });
  } catch (err) {
    console.error("Error fetching available slots:", err);
    res.status(500).json({ error: "Failed to fetch available slots" });
  }
});

function appointmentBlocksSlot(data) {
  if (data.status !== "payment_pending") return true;
  const expiry = data.expiresAt?.toMillis?.() || 0;
  return expiry > Date.now();
}

function escapeHtml(value) {
  const characters = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, character => characters[character]);
}

function getRecordsGuidance(appointment) {
  const council = String(appointment.council || "").toLowerCase();
  const needsFullRecords = council.includes("tfl") || council.includes("full medical records") || council.includes("full records");

  if (needsFullRecords) {
    return {
      level: "Full GP medical records",
      detail: "Bring a digital or printed copy; NHS App access on its own is not enough."
    };
  }

  return {
    level: "Recent GP medical summary",
    detail: "Bring a digital or printed copy and check your licensing authority’s current requirements before attending."
  };
}

function getMedicalFormGuidance(appointment) {
  const medicalType = String(appointment.medicalType || "").toLowerCase();

  if (medicalType.includes("hgv") || medicalType.includes("lgv") || medicalType.includes("bus") || medicalType.includes("coach")) {
    return {
      label: "Your DVLA D4 medical form",
      detail: "Bring a printed DVLA D4 medical examination report form for your Group 2 licence application or renewal."
    };
  }

  return {
    label: "Your council medical form",
    detail: "Download the correct taxi or private-hire form from your licensing authority and bring it with you."
  };
}

function recordsRequestHtml(records) {
  return `<div class="email-records"><h3>How to request your records from your GP</h3><ol><li>Contact your GP surgery by phone, email or online portal and request: <strong>${escapeHtml(records.level)}</strong>.</li><li>Give your full name, date of birth, address and NHS number if known.</li><li>Ask the surgery to provide the records in time for your appointment; it can take up to 28 days.</li><li>Bring a digital or printed copy with you. Do not rely on NHS App access alone.</li></ol></div>`;
}

function clinicTravelHtml() {
  return `<div class="email-travel"><h3>London Clinic – Greenwich</h3><p class="email-address"><strong>Linear House</strong><br>Peyton Place<br>London<br>SE10 8RS</p><p><strong>Parking:</strong> Three paid on-street parking spaces are available on Peyton Place. Further parking is available nearby at Burney Street Car Park; please check signs and current charges.</p><p><strong>Train and DLR:</strong> Greenwich Station is a short walk away, with DLR and National Rail services.</p><p><strong>Bus:</strong> Nearby routes include 129, 177, 199 and 386. The N199 also serves the area at night.</p></div>`;
}

function appointmentChecklistHtml(appointment, records) {
  const medicalForm = getMedicalFormGuidance(appointment);
  const remainingAmount = Number(appointment.remainingAmount || 0);
  const balanceItem = remainingAmount > 0
    ? `<li><span class="email-number">7</span><span><strong>Outstanding balance</strong><br>Bring <strong>£${(remainingAmount / 100).toFixed(2)} cash</strong> to pay the remaining balance at the clinic.</span></li>`
    : "";

  return `<div class="email-checklist"><h3>What to bring to your appointment</h3><ol><li><span class="email-number">1</span><span><strong>Medical records</strong><br>${escapeHtml(records.level)}</span></li><li><span class="email-number">2</span><span><strong>Photo ID and proof of address</strong><br>Passport or driving licence, plus a recent bank statement, utility bill or similar proof of address.</span></li><li><span class="email-number">3</span><span><strong>Glasses or contact lenses</strong><br>Bring those you use for driving.</span></li><li><span class="email-number">4</span><span><strong>Medication list</strong><br>An up-to-date prescription printout or a list of all medicines and doses.</span></li><li><span class="email-number">5</span><span><strong>Relevant medical evidence</strong><br>Bring any relevant clinic letters. If you use insulin or medicines that can cause low blood glucose (hypos), bring your blood glucose meter or continuous glucose monitor and at least six weeks of readings.</span></li><li><span class="email-number">6</span><span><strong>${escapeHtml(medicalForm.label)}</strong><br>${escapeHtml(medicalForm.detail)}</span></li>${balanceItem}</ol></div>`;
}

function bookingEmailHtml({ title, preview, content }) {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#17231e;"><div style="max-width:680px;margin:0 auto;padding:28px 16px;"><div style="padding:24px 28px;background:#0d5d48;border-radius:18px 18px 0 0;color:#ffffff;"><div style="font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#bce9d7;">Pro Driver Medicals</div><h1 style="margin:8px 0 0;font-size:29px;line-height:1.18;color:#ffffff;">${escapeHtml(title)}</h1></div><div style="padding:28px;background:#ffffff;border-radius:0 0 18px 18px;box-shadow:0 8px 24px rgba(23,35,30,.08);"><p style="margin:0 0 22px;color:#53625b;font-size:16px;line-height:1.6;">${preview}</p>${content}<p style="margin:28px 0 0;padding-top:22px;border-top:1px solid #e2e9e5;color:#53625b;font-size:14px;line-height:1.6;">Need help? Call <a href="tel:07480609640" style="color:#0d5d48;font-weight:700;text-decoration:none;">07480 609640</a>.</p></div></div><style>.email-details{width:100%;border-collapse:collapse;margin:20px 0;background:#edf8f2;border-radius:12px;overflow:hidden}.email-details td{padding:10px 14px;border-bottom:1px solid #d9eee2;font-size:14px;line-height:1.45}.email-details tr:last-child td{border:0}.email-details td:first-child{width:38%;color:#486258;font-weight:700}.email-checklist{margin-top:26px}.email-checklist h3,.email-records h3,.email-travel h3{margin:0 0 14px;color:#17382c;font-size:19px}.email-checklist ol,.email-records ol{margin:0;padding:0;list-style:none}.email-checklist li{display:flex;gap:11px;margin:0 0 12px;padding:13px;background:#f7faf8;border-radius:10px;color:#4d5e56;font-size:14px;line-height:1.5}.email-number{display:inline-block;flex:0 0 25px;width:25px;height:25px;border-radius:50%;background:#0d5d48;color:#fff;font-size:12px;line-height:25px;text-align:center;font-weight:700}.email-records{margin-top:28px;padding:20px;background:#fff8e9;border-radius:12px}.email-records li{margin:0 0 9px;padding-left:22px;position:relative;color:#5d553c;font-size:14px;line-height:1.5}.email-records li:before{content:'✓';position:absolute;left:0;color:#a06609;font-weight:700}.email-travel{margin-top:24px;padding:20px;border:1px solid #d7e8df;border-radius:12px;background:#f6faf8;color:#4d5e56;font-size:14px;line-height:1.55}.email-travel p{margin:9px 0}.email-travel .email-address{padding:12px 14px;border-left:4px solid #0d5d48;background:#edf8f2;border-radius:7px;color:#294b3e}</style></body></html>`;
}

async function sendAppointmentEmails(appointment) {
  const paid = `£${(appointment.paidAmount / 100).toFixed(2)}`;
  const remaining = `£${(appointment.remainingAmount / 100).toFixed(2)}`;
  const records = getRecordsGuidance(appointment);
  const customerName = `${escapeHtml(appointment.firstName)} ${escapeHtml(appointment.lastName)}`;
  const appointmentDetails = `<table class="email-details" role="presentation"><tr><td>Date</td><td>${escapeHtml(displayAppointmentDate(appointment.date))}</td></tr><tr><td>Time</td><td>${escapeHtml(appointment.time)}</td></tr><tr><td>Location</td><td>${escapeHtml(appointment.clinic)}</td></tr><tr><td>Medical type</td><td>${escapeHtml(appointment.medicalType)}</td></tr>${appointment.council ? `<tr><td>Licensing authority</td><td>${escapeHtml(appointment.council)}</td></tr>` : ""}<tr><td>Paid online</td><td>${paid}</td></tr>${appointment.remainingAmount > 0 ? `<tr><td>Remaining balance</td><td>${remaining} cash at the clinic</td></tr>` : ""}</table>`;
  const address = [appointment.addressLine1, appointment.addressLine2, appointment.city, appointment.postcode].filter(Boolean).map(escapeHtml).join(", ");
  try {
    await sendBookingEmail({
      to: appointment.email,
      subject: "Your Pro Driver Medicals Appointment Confirmation",
      html: bookingEmailHtml({
        title: "Your appointment is confirmed",
        preview: `Dear ${customerName}, please arrive 10 minutes early for your driver medical.`,
        content: `${appointmentDetails}${clinicTravelHtml()}<p style="margin:22px 0 0;padding:16px;background:#edf8f2;border-left:4px solid #0d5d48;border-radius:8px;line-height:1.55;"><strong>Records required: ${escapeHtml(records.level)}</strong><br>${escapeHtml(records.detail)}</p>${appointmentChecklistHtml(appointment, records)}${recordsRequestHtml(records)}`
      })
    });
    try {
      await sendBookingEmail({
        to: bookingAdminEmail,
        subject: "New paid appointment booking",
        html: bookingEmailHtml({
          title: "New paid appointment",
          preview: `<strong>${customerName}</strong><br>${escapeHtml(appointment.email)} · ${escapeHtml(appointment.phone)}<br>${address}`,
          content: `${appointmentDetails}${clinicTravelHtml()}<p style="margin:22px 0 0;padding:16px;background:#edf8f2;border-left:4px solid #0d5d48;border-radius:8px;line-height:1.55;"><strong>Records required: ${escapeHtml(records.level)}</strong><br>${escapeHtml(records.detail)}</p>${appointmentChecklistHtml(appointment, records)}`
        })
      });
    } catch (adminEmailError) {
      console.error("❌ Admin appointment email error:", adminEmailError);
    }
    return true;
  } catch (emailError) {
    console.error("❌ Appointment email error:", emailError);
    return false;
  }
}

async function confirmPaidAppointment(session) {
  const appointmentId = session.metadata.appointmentId;
  if (!appointmentId) throw new Error("Stripe session is missing appointmentId");
  const appointmentRef = admin.firestore().collection("appointments").doc(appointmentId);
  let confirmedAppointment;

  await admin.firestore().runTransaction(async transaction => {
    const snapshot = await transaction.get(appointmentRef);
    if (!snapshot.exists) throw new Error("Appointment reservation not found");
    const appointment = snapshot.data();
    if (appointment.status === "confirmed") {
      confirmedAppointment = appointment;
      return;
    }
    const paidAmount = session.amount_total || 0;
    const remainingAmount = appointment.paymentChoice === "full" ? 0 : 3800;
    confirmedAppointment = { ...appointment, paidAmount, remainingAmount, status: "confirmed" };
    transaction.update(appointmentRef, {
      status: "confirmed",
      paidAmount,
      remainingAmount,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent || null,
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  if (confirmedAppointment?.status === "confirmed" && !confirmedAppointment.confirmationEmailSent) {
    const sent = await sendAppointmentEmails(confirmedAppointment);
    if (sent) await appointmentRef.update({ confirmationEmailSent: true });
  }
}

app.post("/api/create-booking-checkout", async (req, res) => {
  if (!motorMedicalsStripe) {
    return res.status(503).json({ error: "Pro Driver Medicals payments are not configured yet" });
  }
  const {
    medicalType, clinic, date, time, firstName, lastName,
    email, phone, addressLine1, addressLine2, city, postcode, council, paymentChoice
  } = req.body;

  if (!medicalType || !clinic || !date || !time || !firstName || !lastName || !email || !phone || !addressLine1 || !city || !postcode) {
    return res.status(400).json({ error: "Please complete every required booking field" });
  }
  if (!isBookableAppointment(date, time)) {
    return res.status(400).json({ error: "Please choose an available Wednesday appointment slot" });
  }
  if (!['deposit', 'full'].includes(paymentChoice)) {
    return res.status(400).json({ error: "Choose whether to pay the £5 deposit or the full £43" });
  }

  const appointmentId = `${date}_${time.replace(/[^0-9apm]/gi, "")}`;
  const appointmentRef = admin.firestore().collection("appointments").doc(appointmentId);
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 31 * 60 * 1000);
  const appointmentData = {
    medicalType, clinic, date, time, firstName, lastName, email, phone, addressLine1, addressLine2: addressLine2 || null, city, postcode,
    council: council || null,
    paymentChoice,
    status: "payment_pending",
    paidAmount: 0,
    remainingAmount: paymentChoice === "full" ? 0 : 3800,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt
  };

  try {
    await admin.firestore().runTransaction(async transaction => {
      const existing = await transaction.get(appointmentRef);
      if (existing.exists && appointmentBlocksSlot(existing.data())) {
        const error = new Error("This appointment slot is already reserved or booked");
        error.code = "SLOT_TAKEN";
        throw error;
      }
      transaction.set(appointmentRef, appointmentData);
    });

    const safeOrigin = process.env.PUBLIC_BASE_URL || "https://oscereal-706d4.web.app";
    const amount = paymentChoice === "full" ? 4300 : 500;
    const description = paymentChoice === "full"
      ? "Full payment for driver medical"
      : "£5 deposit; £38 payable at the clinic";
    const session = await motorMedicalsStripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [{
        price_data: {
          currency: "gbp",
          unit_amount: amount,
          product_data: { name: "Pro Driver Medicals appointment", description }
        },
        quantity: 1
      }],
      metadata: { bookingType: "driver-medical", appointmentId },
      success_url: `${safeOrigin}/booking-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeOrigin}/?payment=cancelled#book`
    });

    await appointmentRef.update({ stripeCheckoutSessionId: session.id });
    res.json({ url: session.url });
  } catch (error) {
    if (error.code === "SLOT_TAKEN") return res.status(409).json({ error: error.message });
    await appointmentRef.delete().catch(() => {});
    console.error("Booking checkout error:", error);
    res.status(500).json({ error: "Unable to start secure payment. Please try again." });
  }
});

app.get("/api/booking-confirmation", async (req, res) => {
  if (!motorMedicalsStripe) {
    return res.status(503).json({ error: "Pro Driver Medicals payments are not configured yet" });
  }

  const sessionId = String(req.query.session_id || "");
  if (!sessionId) return res.status(400).json({ error: "Missing checkout session" });

  try {
    const session = await motorMedicalsStripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.bookingType !== "driver-medical" || session.payment_status !== "paid") {
      return res.status(404).json({ error: "Confirmed booking not found" });
    }

    await confirmPaidAppointment(session);
    const appointmentId = session.metadata.appointmentId;
    const appointmentSnapshot = await admin.firestore().collection("appointments").doc(appointmentId).get();
    if (!appointmentSnapshot.exists) return res.status(404).json({ error: "Confirmed booking not found" });

    const appointment = appointmentSnapshot.data();
    res.json({
      firstName: appointment.firstName,
      date: displayAppointmentDate(appointment.date),
      time: appointment.time,
      clinic: appointment.clinic,
      medicalType: appointment.medicalType,
      council: appointment.council,
      paidAmount: appointment.paidAmount,
      remainingAmount: appointment.remainingAmount,
      records: getRecordsGuidance(appointment),
      medicalForm: getMedicalFormGuidance(appointment)
    });
  } catch (error) {
    console.error("Booking confirmation lookup error:", error);
    res.status(500).json({ error: "Unable to load your booking confirmation" });
  }
});

// Legacy direct-booking route retained for older clients; payment is now required.
app.post("/api/book-appointment", async (req, res) => {
  return res.status(410).json({ error: "Online payment is now required. Please restart your booking." });
  /*
  try {
    console.log("📥 Booking request received:", req.body);
    
    const {
      medicalType,
      clinic,
      date,
      time,
      firstName,
      lastName,
      email,
      phone,
      postcode,
      council
    } = req.body;
    
    if (!date || !time || !email || !firstName || !lastName || !clinic || !phone || !postcode) {
      console.error("❌ Missing required fields:", { date, time, email, firstName, lastName, clinic, phone, postcode });
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!isBookableAppointment(date, time)) {
      console.error("❌ Invalid appointment slot:", { date, time });
      return res.status(400).json({ error: "Please choose an available Wednesday appointment slot" });
    }
    
    console.log("✅ Validation passed, proceeding with booking");
    
    const db = admin.firestore();
    
    const appointmentData = {
      medicalType,
      clinic,
      date,
      time,
      firstName,
      lastName,
      email,
      phone,
      postcode,
      council: council || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "confirmed"
    };
    
    const appointmentId = `${date}_${time.replace(/[^0-9apm]/gi, "")}`;
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    try {
      await db.runTransaction(async transaction => {
        const existingBooking = await transaction.get(appointmentRef);
        if (existingBooking.exists) {
          const slotError = new Error("This time slot is already booked");
          slotError.code = "SLOT_TAKEN";
          throw slotError;
        }
        transaction.create(appointmentRef, appointmentData);
      });
    } catch (bookingError) {
      if (bookingError.code === "SLOT_TAKEN") {
        return res.status(409).json({ error: "This time slot has just been booked. Please choose another time." });
      }
      throw bookingError;
    }
    
    // Send confirmation email to the customer (if Gmail SMTP is configured)
    let confirmationEmailSent = false;
    console.log("📧 Email transport configured:", !!bookingEmailTransport);
    console.log("📧 GMAIL_USER set:", !!process.env.GMAIL_USER);
    console.log("📧 GMAIL_APP_PASSWORD set:", !!process.env.GMAIL_APP_PASSWORD);
    
    if (bookingEmailTransport) {
      try {
        const customerMsg = {
          to: email,
          from: process.env.GMAIL_USER,
          subject: "Your Pro Driver Medicals Appointment Confirmation",
          html: `
            <h2>Appointment Confirmed</h2>
            <p>Dear ${firstName} ${lastName},</p>
            <p>Your appointment has been successfully booked for:</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Location:</strong> ${clinic}</p>
            <p><strong>Medical Type:</strong> ${medicalType}</p>
            ${council ? `<p><strong>Council:</strong> ${council}</p>` : ''}
            <p>Please arrive 10 minutes early and bring any required documents.</p>
            <p>If you need to reschedule, please call us at 07480 609640.</p>
            <p>Thank you,<br>Pro Driver Medicals Team</p>
          `
        };
        
        console.log("📧 Sending customer email to:", email);
        await bookingEmailTransport.sendMail(customerMsg);
        console.log("✅ Customer email sent");
        
        // Send notification email to admin
        const adminMsg = {
          to: "zak.francillon@gmail.com",
          from: process.env.GMAIL_USER,
          subject: "New Appointment Booking",
          html: `
            <h2>New Appointment Booked</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Postcode:</strong> ${postcode}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Medical Type:</strong> ${medicalType}</p>
            <p><strong>Location:</strong> ${clinic}</p>
            ${council ? `<p><strong>Council:</strong> ${council}</p>` : ''}
          `
        };
        
        console.log("📧 Sending admin email");
        await bookingEmailTransport.sendMail(adminMsg);
        console.log("✅ Admin email sent");
        confirmationEmailSent = true;
      } catch (emailError) {
        console.error("❌ Error sending emails:", emailError);
        // Continue with booking even if email fails
      }
    } else {
      console.warn("⚠️ Email transport not configured - skipping emails");
    }
    
    res.json({ success: true, confirmationEmailSent, message: "Appointment booked successfully" });
  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).json({ error: "Failed to book appointment" });
  }
  */
});

//Is to ping render when user accesses main page/index.html so that it wakes up render. Frontend JS is inside index.html btw
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});









// ---------------------------------------------------------- //


const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));

