import dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";
dotenv.config();
initializeApp();
const adminDb = getFirestore();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const analysisModel = process.env.OPENAI_MODEL_ANALYSIS || "gpt-5-mini";
const marketModel = process.env.OPENAI_MODEL_MARKET || "gpt-5";
const quotesModel = process.env.OPENAI_MODEL_QUOTES || "gpt-5-mini";
const siteModel = process.env.OPENAI_MODEL_SITE || "gpt-5-mini";
const floorPlanModel = process.env.OPENAI_MODEL_FLOORPLAN || "gpt-5-mini";
function ensureOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new HttpsError(
      "failed-precondition",
      "OPENAI_API_KEY is missing in function config.",
    );
  }
}
function requireAuth(request) {
  if (!request.auth?.uid)
    throw new HttpsError("unauthenticated", "Sign in is required.");
  if (process.env.ENFORCE_APP_CHECK === "true" && !request.app) {
    throw new HttpsError("failed-precondition", "App Check token required.");
  }
  return request.auth.uid;
}
async function requireAdmin(request) {
  const uid = requireAuth(request);
  if (request.auth?.token?.role === "admin") return uid;
  const userDoc = await adminDb.doc(`users/${uid}`).get();
  if (
    !userDoc.exists ||
    userDoc.get("role") !== "admin" ||
    userDoc.get("status") !== "active"
  ) {
    throw new HttpsError("permission-denied", "Admin role required.");
  }
  return uid;
}
async function logInvocation(uid, name, payload) {
  await adminDb
    .collection("functionAudit")
    .add({ uid, name, payload, createdAt: new Date().toISOString() });
}
const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ready", "error"] },
    summary: { type: "string" },
    risks: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } },
    procurementNotes: { type: "array", items: { type: "string" } },
    paymentReleaseChecks: { type: "array", items: { type: "string" } },
    locationInsights: { type: "array", items: { type: "string" } },
    plumbingInsights: { type: "array", items: { type: "string" } },
    electricalInsights: { type: "array", items: { type: "string" } },
    ownerQuestions: { type: "array", items: { type: "string" } },
  },
  required: [
    "status",
    "summary",
    "risks",
    "opportunities",
    "procurementNotes",
    "paymentReleaseChecks",
    "locationInsights",
    "plumbingInsights",
    "electricalInsights",
    "ownerQuestions",
  ],
};
const marketSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    city: { type: "string" },
    sourceMode: { type: "string", enum: ["manual", "market", "hybrid"] },
    notes: { type: "array", items: { type: "string" } },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          materialId: { type: "string" },
          materialName: { type: "string" },
          unit: { type: "string" },
          suggestedRate: { type: "number" },
          lowRate: { type: "number" },
          highRate: { type: "number" },
          rationale: { type: "string" },
          refreshedAt: { type: "string" },
          sources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                url: { type: "string" },
              },
              required: ["title", "url"],
            },
          },
        },
        required: [
          "materialId",
          "materialName",
          "unit",
          "suggestedRate",
          "lowRate",
          "highRate",
          "rationale",
          "refreshedAt",
          "sources",
        ],
      },
    },
  },
  required: ["city", "sourceMode", "notes", "items"],
};
const quoteSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ready", "error"] },
    summary: { type: "string" },
    bestValueVendor: { type: "string" },
    cheapestVendor: { type: "string" },
    fastestVendor: { type: "string" },
    negotiationPoints: { type: "array", items: { type: "string" } },
    redFlags: { type: "array", items: { type: "string" } },
    scopeGaps: { type: "array", items: { type: "string" } },
  },
  required: [
    "status",
    "summary",
    "bestValueVendor",
    "cheapestVendor",
    "fastestVendor",
    "negotiationPoints",
    "redFlags",
    "scopeGaps",
  ],
};
const siteSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ready", "error"] },
    summary: { type: "string" },
    urgentIssues: { type: "array", items: { type: "string" } },
    nextChecks: { type: "array", items: { type: "string" } },
    workerInstructions: { type: "array", items: { type: "string" } },
    paymentHoldPoints: { type: "array", items: { type: "string" } },
  },
  required: [
    "status",
    "summary",
    "urgentIssues",
    "nextChecks",
    "workerInstructions",
    "paymentHoldPoints",
  ],
};
const floorPlanSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ready", "error"] },
    summary: { type: "string" },
    builtUpSftRange: {
      type: "object",
      additionalProperties: false,
      properties: { min: { type: "number" }, max: { type: "number" } },
      required: ["min", "max"],
    },
    inferredRooms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          count: { type: "number" },
          approximateAreaSft: { type: "number" },
        },
        required: ["name", "count", "approximateAreaSft"],
      },
    },
    inferredBathrooms: { type: "number" },
    inferredBalconies: { type: "number" },
    inferredKitchenCount: { type: "number" },
    plumbingFixtures: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          item: { type: "string" },
          quantity: { type: "number" },
          note: { type: "string" },
        },
        required: ["item", "quantity", "note"],
      },
    },
    materialAdjustments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          material: { type: "string" },
          deltaPercentage: { type: "number" },
          rationale: { type: "string" },
        },
        required: ["material", "deltaPercentage", "rationale"],
      },
    },
    boqHints: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string" },
          item: { type: "string" },
          basis: { type: "string" },
          quantityHint: { type: "string" },
          note: { type: "string" },
        },
        required: ["category", "item", "basis", "quantityHint", "note"],
      },
    },
    followUpQuestions: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
  },
  required: [
    "status",
    "summary",
    "builtUpSftRange",
    "inferredRooms",
    "inferredBathrooms",
    "inferredBalconies",
    "inferredKitchenCount",
    "plumbingFixtures",
    "materialAdjustments",
    "boqHints",
    "followUpQuestions",
    "assumptions",
  ],
};
async function runFloorPlanAnalysis(uid, payload) {
  if (!payload?.imageDataUrl || !payload?.projectName || !payload?.location) {
    throw new HttpsError(
      "invalid-argument",
      "imageDataUrl, projectName, and location are required",
    );
  }
  await logInvocation(uid, "analyzeFloorPlan", {
    projectName: payload.projectName,
    location: payload.location,
  });
  const response = await client.responses.create({
    model: floorPlanModel,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You analyze residential floor plan images for owner-side planning in India. Return only JSON that matches the schema exactly. Infer rooms, likely plumbing fixtures, built-up area range if dimensions are visible, material adjustment hints, and BOQ hints by category.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Project: ${payload.projectName}\nLocation: ${payload.location}\nNotes: ${payload.notes || "None"}`,
          },
          {
            type: "input_image",
            image_url: payload.imageDataUrl,
            detail: "auto",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "floor_plan_analysis_v28",
        schema: floorPlanSchema,
      },
    },
  });
  return JSON.parse(response.output_text);
}
export const analyzeProject = onCall(
  { cors: true, timeoutSeconds: 120 },
  async (request) => {
    ensureOpenAI();
    const uid = requireAuth(request);
    const body = request.data;
    await logInvocation(uid, "analyzeProject", {
      projectName: body?.input?.projectName || "",
    });
    const response = await client.responses.create({
      model: analysisModel,
      input: [
        {
          role: "system",
          content:
            "You are Bharat Makaan AI, an Indian owner-side house-construction analyst. Return only JSON that matches the schema exactly. Do not pretend to be a licensed engineer.",
        },
        { role: "user", content: JSON.stringify(body) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "construction_analysis_v28",
          schema: analysisSchema,
        },
      },
    });
    return JSON.parse(response.output_text);
  },
);
export const refreshMarketRates = onCall(
  { cors: true, timeoutSeconds: 120 },
  async (request) => {
    ensureOpenAI();
    const uid = await requireAdmin(request);
    const payload = request.data;
    if (
      !payload?.city ||
      !Array.isArray(payload.materials) ||
      payload.materials.length < 1
    ) {
      throw new HttpsError(
        "invalid-argument",
        "city and materials are required",
      );
    }
    await logInvocation(uid, "refreshMarketRates", {
      city: payload.city,
      count: payload.materials.length,
    });
    if (payload.sourceMode === "manual") {
      return {
        city: payload.city,
        sourceMode: payload.sourceMode,
        notes: ["Manual mode selected. No market refresh was run."],
        items: payload.materials.map((item) => ({
          materialId: item.id,
          materialName: item.name,
          unit: item.unit,
          suggestedRate: item.baseRate,
          lowRate: item.baseRate,
          highRate: item.baseRate,
          rationale: "Manual mode retained the existing admin rate.",
          refreshedAt: new Date().toISOString(),
          sources: [],
        })),
      };
    }
    const response = await client.responses.create({
      model: marketModel,
      reasoning: { effort: "medium" },
      tools: [
        {
          type: "web_search",
          user_location: {
            type: "approximate",
            country: "IN",
            city: payload.city,
            region: payload.state || undefined,
          },
        },
      ],
      tool_choice: "auto",
      include: ["web_search_call.action.sources"],
      input: [
        {
          role: "system",
          content:
            "You are a procurement analyst for Indian residential construction. Use web search and return only JSON matching the schema exactly. Prefer realistic ranges over fake precision.",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "market_rates_v28",
          schema: marketSchema,
        },
      },
    });
    return JSON.parse(response.output_text);
  },
);
export const compareVendorQuotes = onCall(
  { cors: true, timeoutSeconds: 120 },
  async (request) => {
    ensureOpenAI();
    const uid = requireAuth(request);
    const payload = request.data;
    await logInvocation(uid, "compareVendorQuotes", {
      quotes: Array.isArray(payload.quotes) ? payload.quotes?.length : 0,
    });
    const response = await client.responses.create({
      model: quotesModel,
      input: [
        {
          role: "system",
          content:
            "You are an owner-side construction commercial analyst in India. Compare quotes and return only JSON matching the schema exactly.",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "quote_compare_v28",
          schema: quoteSchema,
        },
      },
    });
    return JSON.parse(response.output_text);
  },
);
export const reviewSiteObservation = onCall(
  { cors: true, timeoutSeconds: 120 },
  async (request) => {
    ensureOpenAI();
    const uid = requireAuth(request);
    const payload = request.data;
    if (
      !payload?.projectName ||
      !payload?.phase ||
      !payload?.observationNotes
    ) {
      throw new HttpsError(
        "invalid-argument",
        "projectName, phase, and observationNotes are required",
      );
    }
    await logInvocation(uid, "reviewSiteObservation", {
      projectName: payload.projectName,
      phase: payload.phase,
    });
    const response = await client.responses.create({
      model: siteModel,
      input: [
        {
          role: "system",
          content:
            "You are an owner-side site QA assistant for Indian residential construction. Return only JSON matching the schema exactly.",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "site_review_v28",
          schema: siteSchema,
        },
      },
    });
    return JSON.parse(response.output_text);
  },
);
export const analyzeFloorPlan = onCall(
  { cors: true, timeoutSeconds: 120, memory: "1GiB" },
  async (request) => {
    ensureOpenAI();
    const uid = requireAuth(request);
    const payload = request.data;
    return runFloorPlanAnalysis(uid, payload);
  },
);
