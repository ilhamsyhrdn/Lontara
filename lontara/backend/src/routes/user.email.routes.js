const express = require("express");
const { google } = require("googleapis");
const { authMiddleware } = require("../middlewares/auth");
const { decrypt } = require("../utils/crypto");
const prisma = require("../config/prisma");
const classifier = require("../services/machine-learning/classifier.service");
const pdfService = require("../services/machine-learning/pdf.service");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Helper function to get authenticated Gmail client
async function getGmailClient(userId) {
  console.log("🔍 getGmailClient called for userId:", userId);

  if (!userId) {
    throw new Error("User ID is required");
  }

  const gmailConnection = await prisma.userGmail.findUnique({
    where: { authUserId: userId },
  });

  if (!gmailConnection || !gmailConnection.encryptedRefresh) {
    throw new Error("Gmail not connected. Please connect your Gmail first.");
  }

  const refreshToken = decrypt(gmailConnection.encryptedRefresh);

  if (!refreshToken) {
    throw new Error("Failed to decrypt Gmail token");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:5000/api/user/gmail-callback"
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // ✅ ADD: Update last used timestamp
  await prisma.userGmail.update({
    where: { authUserId: userId },
    data: { lastUsedAt: new Date() },
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

// Helper function to parse email message

async function parseMessage(message, gmail = null) {
  const headers = message.payload.headers;
  const getHeader = (name) => {
    const header = headers.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    );
    return header ? header.value : "";
  };

  let bodyText = "";
  let bodyHtml = "";
  let hasAttachments = false;
  const attachments = [];

  const decode = (data) => Buffer.from(data, "base64").toString("utf-8");

  // 🔹 Handle body di level paling atas
  if (message.payload?.body?.data) {
    const mime = message.payload.mimeType || "";
    if (mime.startsWith("text/html")) {
      bodyHtml = decode(message.payload.body.data);
    } else if (mime.startsWith("text/plain")) {
      bodyText = decode(message.payload.body.data);
    }
  }

  // 🔹 Handle parts (multipart email)
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      const mime = part.mimeType || "";

      // Ambil text/plain
      if (mime.startsWith("text/plain") && part.body?.data) {
        bodyText = decode(part.body.data);
      }

      // Ambil text/html (🎯 INI YANG KAMU MAU)
      if (mime.startsWith("text/html") && part.body?.data) {
        bodyHtml = decode(part.body.data);
      }

      // ✅ Detect attachments (jangan diutak-atik)
      if (part.filename && part.filename.length > 0) {
        hasAttachments = true;

        const attachmentInfo = {
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId || null,
          extractedText: "",
        };

        // (PDF handling kalau pakai gmail client, tetap seperti kode kamu sebelumnya)
        if (
          part.mimeType === "application/pdf" &&
          part.body.attachmentId &&
          gmail
        ) {
          try {
            console.log(`📄 Downloading attachment: ${part.filename}`);

            const attachment = await gmail.users.messages.attachments.get({
              userId: "me",
              messageId: message.id,
              id: part.body.attachmentId,
            });

            const pdfText = await pdfService.extractFromBase64(
              attachment.data.data
            );
            attachmentInfo.extractedText = pdfText.trim();

            console.log(
              `✅ Extracted ${pdfText.length} chars from ${part.filename}`
            );
          } catch (err) {
            console.error(
              `❌ Failed to extract PDF text from ${part.filename}:`,
              err.message
            );
          }
        }

        attachments.push(attachmentInfo);
      }
    }
  }

  const body = (bodyHtml || bodyText || "").trim();

  return {
    id: message.id,
    threadId: message.threadId,
    labelIds: message.labelIds || [],
    snippet: message.snippet || "",
    isRead: !message.labelIds?.includes("UNREAD"),
    from: getHeader("From"),
    to: getHeader("To"),
    subject: getHeader("Subject"),
    date: getHeader("Date"),
    body,
    bodyText,
    bodyHtml,
    hasAttachments,
    attachments,
  };
}

const handleGmailError = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error("❌ Gmail API error:", err.message);

    if (err.message === "GMAIL_TOKEN_EXPIRED") {
      return res.status(401).json({
        success: false,
        message:
          "Your Gmail connection has expired. Please reconnect your Gmail account.",
        code: "GMAIL_TOKEN_EXPIRED",
        reconnectRequired: true,
      });
    }

    if (err.message === "GMAIL_NOT_CONNECTED") {
      return res.status(400).json({
        success: false,
        message:
          "Gmail not connected. Please connect your Gmail account first.",
        code: "GMAIL_NOT_CONNECTED",
        reconnectRequired: true,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: err.message,
    });
  }
};

// =========================================
// ML CLASSIFICATION ROUTES (BEFORE :id routes!)
// =========================================
router.get("/test", (req, res) => {
  res.json({ message: "Email routes working!" });
});

// ✅ Debug scope route
router.get("/debug-scope", authMiddleware, async (req, res) => {
  try {
    const gmailConnection = await prisma.userGmail.findUnique({
      where: { authUserId: req.user.sub },
    });

    if (!gmailConnection) {
      return res.json({
        connected: false,
        message: "Gmail not connected",
      });
    }

    const refreshToken = decrypt(gmailConnection.encryptedRefresh);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:5000/api/user/gmail-callback"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { token } = await oauth2Client.getAccessToken();
    const tokenInfo = await oauth2Client.getTokenInfo(token);

    console.log("✅ Token scopes:", tokenInfo.scopes);

    res.json({
      connected: true,
      scopes: tokenInfo.scopes,
      hasReadScope: tokenInfo.scopes?.includes(
        "https://www.googleapis.com/auth/gmail.readonly"
      ),
      hasSendScope: tokenInfo.scopes?.includes(
        "https://www.googleapis.com/auth/gmail.send"
      ),
      hasComposeScope: tokenInfo.scopes?.includes(
        "https://www.googleapis.com/auth/gmail.compose"
      ),
      hasModifyScope: tokenInfo.scopes?.includes(
        "https://www.googleapis.com/auth/gmail.modify"
      ),
      lastUsedAt: gmailConnection.lastUsedAt,
    });
  } catch (err) {
    console.error("❌ Debug scope error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});
// ✅ Classify inbox emails
router.get(
  "/classify-inbox",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { maxResults = 20 } = req.query;
    const gmail = await getGmailClient(req.user.sub);

    console.log(
      "🔄 Fetching and classifying inbox emails for:",
      req.user.username
    );

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: parseInt(maxResults),
    });

    const messages = response.data.messages || [];

    if (messages.length === 0) {
      return res.json({
        success: true,
        total: 0,
        summary: { peminjaman: 0, izin: 0, pengaduan: 0 },
        emails: [],
        grouped: { peminjaman: [], izin: [], pengaduan: [] },
      });
    }

    const classifiedEmails = await Promise.all(
      messages.map(async (msg) => {
        try {
          const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id,
          });

          // ✅ Pass gmail client to extract PDF
          const parsedEmail = await parseMessage(detail.data, gmail);

          // Build text for classification
          let textToClassify = parsedEmail.subject + " ";

          if (parsedEmail.body) {
            textToClassify += parsedEmail.body;
          } else if (parsedEmail.snippet) {
            textToClassify += parsedEmail.snippet;
          }

          // ✅ Add attachment filenames AND extracted PDF text
          if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
            parsedEmail.attachments.forEach((att) => {
              textToClassify += " " + att.filename;

              // ✅ Include extracted PDF text
              if (att.extractedText) {
                textToClassify += " " + att.extractedText;
              }
            });
          }

          console.log("📧 Classifying:");
          console.log("  Subject:", parsedEmail.subject);
          console.log("  Body length:", parsedEmail.body.length);
          console.log("  Total text length:", textToClassify.length);
          console.log("  Has attachments:", parsedEmail.hasAttachments);

          if (parsedEmail.attachments.length > 0) {
            console.log("  Attachments:");
            parsedEmail.attachments.forEach((att) => {
              console.log(
                `    - ${att.filename} (${
                  att.extractedText?.length || 0
                } chars extracted)`
              );
            });
          }

          // Classify email
          const classification = await classifier.classify({
            subject: parsedEmail.subject,
            body: textToClassify,
          });

          console.log(
            "  ✅ Classified as:",
            classification.category,
            `(${(classification.confidence * 100).toFixed(1)}%)`
          );

          return {
            id: msg.id,
            threadId: msg.threadId,
            ...parsedEmail,
            category: classification.category,
            confidence: classification.confidence,
            confidenceScores: classification.confidenceScores,
            ruleApplied: classification.ruleApplied,
          };
        } catch (error) {
          console.error(`❌ Error classifying email ${msg.id}:`, error.message);
          return null;
        }
      })
    );

    // Filter out failed classifications
    const successfulClassifications = classifiedEmails.filter(
      (email) => email !== null
    );

    // Group by category
    const grouped = {
      peminjaman: successfulClassifications.filter(
        (e) => e.category === "peminjaman"
      ),
      izin: successfulClassifications.filter((e) => e.category === "izin"),
      pengaduan: successfulClassifications.filter(
        (e) => e.category === "pengaduan"
      ),
    };

    console.log("✅ Classification complete:");
    console.log(`   Peminjaman: ${grouped.peminjaman.length}`);
    console.log(`   Izin: ${grouped.izin.length}`);
    console.log(`   Pengaduan: ${grouped.pengaduan.length}`);

    res.json({
      success: true,
      total: successfulClassifications.length,
      summary: {
        peminjaman: grouped.peminjaman.length,
        izin: grouped.izin.length,
        pengaduan: grouped.pengaduan.length,
      },
      emails: successfulClassifications,
      grouped: grouped,
    });
  })
);

// ✅ Get classification statistics
router.get(
  "/:id/classify",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { id } = req.params;
    const gmail = await getGmailClient(req.user.sub);

    console.log("🔍 Classifying email:", id);

    const message = await gmail.users.messages.get({
      userId: "me",
      id: id,
    });

    // ✅ Pass gmail client to extract PDF
    const parsedEmail = await parseMessage(message.data, gmail);

    // Build text with PDF content
    let textToClassify = parsedEmail.subject + " ";

    if (parsedEmail.body) {
      textToClassify += parsedEmail.body;
    } else if (parsedEmail.snippet) {
      textToClassify += parsedEmail.snippet;
    }

    if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
      parsedEmail.attachments.forEach((att) => {
        textToClassify += " " + att.filename;
        if (att.extractedText) {
          textToClassify += " " + att.extractedText;
        }
      });
    }

    const classification = await classifier.classify({
      subject: parsedEmail.subject,
      body: textToClassify,
    });

    res.json({
      success: true,
      email: parsedEmail,
      classification: {
        category: classification.category,
        confidence: classification.confidence,
        confidenceScores: classification.confidenceScores,
        ruleApplied: classification.ruleApplied,
      },
    });
  })
);

// =========================================
// STANDARD EMAIL ROUTES
// =========================================

// ✅ Get inbox emails
router.get(
  "/inbox",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { maxResults = 10, pageToken } = req.query;
    const gmail = await getGmailClient(req.user.sub);

    console.log("✅ Fetching inbox emails for user:", req.user.username);

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: parseInt(maxResults),
      pageToken: pageToken || undefined,
    });

    const messages = response.data.messages || [];
    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });
        // ✅ Pass gmail if you want PDF extraction, or null if not needed
        return parseMessage(detail.data, null);
      })
    );

    console.log("✅ Found", messageDetails.length, "inbox messages");

    res.json({
      success: true,
      messages: messageDetails,
      nextPageToken: response.data.nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate,
    });
  })
);

// ✅ Get sent emails
router.get(
  "/sent",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { maxResults = 10, pageToken } = req.query;
    const gmail = await getGmailClient(req.user.sub);

    console.log("✅ Fetching sent emails for user:", req.user.username);

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["SENT"],
      maxResults: parseInt(maxResults),
      pageToken: pageToken || undefined,
    });

    const messages = response.data.messages || [];
    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });
        return parseMessage(detail.data);
      })
    );

    console.log("✅ Found", messageDetails.length, "sent messages");

    res.json({
      success: true,
      messages: messageDetails,
      nextPageToken: response.data.nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate,
    });
  })
);

// ✅ Get trash emails
router.get(
  "/trash",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { maxResults = 10, pageToken } = req.query;
    const gmail = await getGmailClient(req.user.sub);

    console.log("✅ Fetching trash emails for user:", req.user.username);

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["TRASH"],
      maxResults: parseInt(maxResults),
      pageToken: pageToken || undefined,
    });

    const messages = response.data.messages || [];
    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });
        return parseMessage(detail.data);
      })
    );

    console.log("✅ Found", messageDetails.length, "trash messages");

    res.json({
      success: true,
      messages: messageDetails,
      nextPageToken: response.data.nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate,
    });
  })
);

// ✅ Get draft emails
router.get(
  "/drafts",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const maxResults = parseInt(req.query.maxResults) || 50;
    const gmail = await getGmailClient(req.user.sub);

    console.log("📥 Fetching drafts...");

    // Step 1: Get list of drafts
    const draftsResponse = await gmail.users.drafts.list({
      userId: "me",
      maxResults,
    });

    const draftsList = draftsResponse.data.drafts || [];
    console.log(`📧 Found ${draftsList.length} drafts`);

    if (draftsList.length === 0) {
      return res.json({
        success: true,
        data: { drafts: [] },
      });
    }

    // Step 2: Get full details for each draft
    const drafts = await Promise.all(
      draftsList.map(async (draft) => {
        try {
          const draftDetail = await gmail.users.drafts.get({
            userId: "me",
            id: draft.id,
            format: "full",
          });

          const message = draftDetail.data.message;
          const headers = message?.payload?.headers || [];

          // ✅ Extract headers properly
          const getHeader = (name) => {
            const header = headers.find(
              (h) => h.name.toLowerCase() === name.toLowerCase()
            );
            return header?.value || "";
          };

          // ✅ Extract body
          let body = "";
          const payload = message?.payload;

          if (payload) {
            // Check for plain text body
            if (payload.body?.data) {
              body = Buffer.from(payload.body.data, "base64").toString("utf-8");
            }
            // Check for multipart body
            else if (payload.parts) {
              for (const part of payload.parts) {
                if (part.mimeType === "text/plain" && part.body?.data) {
                  body = Buffer.from(part.body.data, "base64").toString(
                    "utf-8"
                  );
                  break;
                }
                if (part.mimeType === "text/html" && part.body?.data) {
                  body = Buffer.from(part.body.data, "base64").toString(
                    "utf-8"
                  );
                }
              }
            }
          }

          // ✅ Check for attachments
          const hasAttachments =
            payload?.parts?.some(
              (part) => part.filename && part.filename.length > 0
            ) || false;

          return {
            id: draft.id,
            messageId: message?.id,
            threadId: message?.threadId,
            to: getHeader("To"),
            from: getHeader("From"),
            subject: getHeader("Subject") || "(No Subject)",
            snippet: message?.snippet || "",
            body: body,
            date: message?.internalDate
              ? new Date(parseInt(message.internalDate)).toISOString()
              : null,
            hasAttachments,
          };
        } catch (err) {
          console.error(`❌ Error fetching draft ${draft.id}:`, err.message);
          return {
            id: draft.id,
            to: "",
            subject: "(Error loading draft)",
            snippet: "",
            date: null,
            hasAttachments: false,
          };
        }
      })
    );

    console.log("✅ Drafts fetched with details");

    res.json({
      success: true,
      data: { drafts },
    });
  })
);

router.post(
  "/save-drafts",
  authMiddleware,
  upload.array("attachments", 10),
  async (req, res) => {
    try {
      console.log("=".repeat(50));
      console.log("💾 SAVE DRAFT REQUEST");
      console.log("=".repeat(50));

      const { to, subject, body, fields, link } = req.body;

      console.log("📥 Request body:");
      console.log("  - to:", to || "(empty)");
      console.log("  - subject:", subject || "(empty)");
      console.log("  - body length:", body?.length || 0);
      console.log("  - fields:", fields || "(none)");
      console.log("  - link:", link || "(none)");
      console.log("  - attachments:", req.files?.length || 0);
      console.log("  - user ID:", req.user?.sub);

      // ✅ Step 1: Get Gmail client
      let gmail;
      try {
        console.log("🔗 Getting Gmail client...");
        gmail = await getGmailClient(req.user.sub);
        console.log("✅ Gmail client obtained");
      } catch (gmailError) {
        console.error("❌ Gmail client error:", gmailError.message);
        return res.status(401).json({
          success: false,
          message: "Gmail connection failed. Please reconnect.",
          code: "GMAIL_CONNECTION_FAILED",
          error: gmailError.message,
        });
      }

      // ✅ Step 2: Build email message
      console.log("📝 Building email message...");

      const messageParts = [];

      if (to && to.trim()) {
        messageParts.push(`To: ${to.trim()}`);
      }

      messageParts.push(`Subject: ${subject || "(No Subject)"}`);
      messageParts.push("MIME-Version: 1.0");
      messageParts.push('Content-Type: text/html; charset="UTF-8"');
      messageParts.push("");

      // Build HTML body
      let htmlBody = "<html><body>";

      if (body && body.trim()) {
        htmlBody += `<p>${body.replace(/\n/g, "<br>")}</p>`;
      }

      if (fields && fields.trim()) {
        htmlBody += `<p><strong>Department:</strong> ${fields}</p>`;
      }

      if (link && link.trim()) {
        htmlBody += `<p><strong>Link:</strong> <a href="${link}">${link}</a></p>`;
      }

      htmlBody += "</body></html>";
      messageParts.push(htmlBody);

      const email = messageParts.join("\n");

      console.log("📝 Email message built, length:", email.length);

      // ✅ Step 3: Encode message
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      console.log("📝 Encoded email length:", encodedEmail.length);

      // ✅ Step 4: Create draft via Gmail API
      console.log("📤 Creating draft via Gmail API...");

      let result;
      try {
        result = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: {
              raw: encodedEmail,
            },
          },
        });

        console.log("✅ Draft created successfully!");
        console.log("  - Draft ID:", result.data.id);
      } catch (gmailApiError) {
        console.error("❌ Gmail API error:", gmailApiError.message);
        console.error("  - Code:", gmailApiError.code);
        console.error("  - Errors:", JSON.stringify(gmailApiError.errors));

        if (gmailApiError.code === 401) {
          return res.status(401).json({
            success: false,
            message: "Gmail token expired. Please reconnect.",
            code: "GMAIL_TOKEN_EXPIRED",
          });
        }

        if (gmailApiError.code === 403) {
          return res.status(403).json({
            success: false,
            message: "Missing Gmail compose permission.",
            code: "MISSING_COMPOSE_SCOPE",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Gmail API error",
          error: gmailApiError.message,
        });
      }

      res.json({
        success: true,
        message: "Draft saved successfully",
        draftId: result.data.id,
      });
    } catch (error) {
      console.error("=".repeat(50));
      console.error("❌ SAVE DRAFT ERROR");
      console.error("=".repeat(50));
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);

      res.status(500).json({
        success: false,
        message: "Failed to save draft",
        error: error.message,
      });
    }
  }
);

router.post(
  "/send",
  authMiddleware,
  upload.array("attachments", 10), // ✅ Support up to 10 attachments
  handleGmailError(async (req, res) => {
    const { to, subject, body, fields, link } = req.body;
    const gmail = await getGmailClient(req.user.sub);

    console.log("📧 Sending email to:", to);

    // Build email message
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: multipart/mixed; boundary="boundary"',
      "",
      "--boundary",
      "Content-Type: text/html; charset=UTF-8",
      "",
      `<html><body>`,
      `<p>${body.replace(/\n/g, "<br>")}</p>`,
      fields ? `<p><strong>Department:</strong> ${fields}</p>` : "",
      link ? `<p><strong>Link:</strong> <a href="${link}">${link}</a></p>` : "",
      `</body></html>`,
      "--boundary",
    ];

    // Add attachments if present
    if (req.files && req.files.length > 0) {
      console.log(`📎 Adding ${req.files.length} attachments`);

      for (const file of req.files) {
        const base64Data = file.buffer.toString("base64");

        messageParts.push(
          `Content-Type: ${file.mimetype}; name="${file.originalname}"`,
          "Content-Transfer-Encoding: base64",
          `Content-Disposition: attachment; filename="${file.originalname}"`,
          "",
          base64Data,
          "--boundary"
        );
      }
    }

    messageParts.push("--boundary--");

    // Encode message
    const email = messageParts.join("\n");
    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send via Gmail API
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log("✅ Email sent successfully:", result.data.id);

    res.json({
      success: true,
      message: "Email sent successfully",
      messageId: result.data.id,
    });
  })
);

// ✅ Get unread count
router.get(
  "/unread-count",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const gmail = await getGmailClient(req.user.sub);

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX", "UNREAD"],
      maxResults: 1,
    });

    console.log("✅ Unread count:", response.data.resultSizeEstimate || 0);

    res.json({
      success: true,
      count: response.data.resultSizeEstimate || 0,
    });
  })
);

// ✅ Search emails
router.get(
  "/search",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { q, maxResults = 10, pageToken } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query (q) is required",
      });
    }

    const gmail = await getGmailClient(req.user.sub);

    console.log("✅ Searching emails with query:", q);

    const response = await gmail.users.messages.list({
      userId: "me",
      q: q,
      maxResults: parseInt(maxResults),
      pageToken: pageToken || undefined,
    });

    const messages = response.data.messages || [];
    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });
        return parseMessage(detail.data);
      })
    );

    console.log("✅ Found", messageDetails.length, "messages matching query");

    res.json({
      success: true,
      messages: messageDetails,
      nextPageToken: response.data.nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate,
    });
  })
);

// バ. Download attachment by message/attachment id
router.get(
  "/:messageId/attachments/:attachmentId",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { messageId, attachmentId } = req.params;
    const { mimeType, filename } = req.query;
    const gmail = await getGmailClient(req.user.sub);

    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });

    const data = attachment.data?.data;
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Attachment not found" });
    }

    const buffer = Buffer.from(data, "base64");
    const safeName = (filename || "attachment").replace(/[/\\"]/g, "");
    res.set("Content-Type", mimeType || "application/octet-stream");
    res.set("Content-Disposition", `inline; filename="${safeName}"`);
    res.send(buffer);
  })
);

// =========================================
// DYNAMIC :id ROUTES (MUST BE LAST!)
// =========================================

// ✅ Classify single email by ID
router.get(
  "/:id/classify",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { id } = req.params;
    const gmail = await getGmailClient(req.user.sub);

    console.log("🔍 Classifying email:", id);

    const message = await gmail.users.messages.get({
      userId: "me",
      id: id,
    });

    const parsedEmail = parseMessage(message.data);

    // ✅ NEW: Build text with attachments
    let textToClassify = parsedEmail.subject + " ";

    if (parsedEmail.body) {
      textToClassify += parsedEmail.body;
    } else if (parsedEmail.snippet) {
      textToClassify += parsedEmail.snippet;
    }

    if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
      parsedEmail.attachments.forEach((att) => {
        textToClassify += " " + att.filename;
      });
    }

    const classification = await classifier.classify({
      subject: parsedEmail.subject,
      body: textToClassify,
    });

    res.json({
      success: true,
      email: parsedEmail,
      classification: {
        category: classification.category,
        confidence: classification.confidence,
        confidenceScores: classification.confidenceScores,
        ruleApplied: classification.ruleApplied,
      },
    });
  })
);

// ✅ Get specific email by ID
router.get(
  "/:id",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { id } = req.params;
    const gmail = await getGmailClient(req.user.sub);

    console.log("✅ Fetching email:", id);

    const message = await gmail.users.messages.get({
      userId: "me",
      id: id,
    });

    res.json({
      success: true,
      email: parseMessage(message.data),
    });
  })
);

// ✅ Mark email as read
router.post(
  "/:id/read",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { id } = req.params;
    const gmail = await getGmailClient(req.user.sub);

    await gmail.users.messages.modify({
      userId: "me",
      id: id,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });

    console.log("✅ Email marked as read:", id);

    res.json({ success: true, message: "Marked as read" });
  })
);

// ✅ Mark email as unread
router.post(
  "/:id/unread",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { id } = req.params;
    const gmail = await getGmailClient(req.user.sub);

    await gmail.users.messages.modify({
      userId: "me",
      id: id,
      requestBody: {
        addLabelIds: ["UNREAD"],
      },
    });

    console.log("✅ Email marked as unread:", id);

    res.json({ success: true, message: "Marked as unread" });
  })
);

// ✅ Delete email (move to trash)
router.delete(
  "/:id",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { id } = req.params;
    const gmail = await getGmailClient(req.user.sub);

    await gmail.users.messages.trash({
      userId: "me",
      id: id,
    });

    console.log("✅ Email moved to trash:", id);

    res.json({ success: true, message: "Email moved to trash" });
  })
);

// ✅ Permanently delete email
router.delete(
  "/:id/permanent",
  authMiddleware,
  handleGmailError(async (req, res) => {
    const { id } = req.params;
    const gmail = await getGmailClient(req.user.sub);

    await gmail.users.messages.delete({
      userId: "me",
      id: id,
    });

    console.log("✅ Email permanently deleted:", id);

    res.json({ success: true, message: "Email permanently deleted" });
  })
);

module.exports = router;
