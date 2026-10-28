declare const Netlify: {
  env: {
    get(name: string): string | undefined;
  };
};

type ProjectInput = {
  plotWidth?: number;
  plotLength?: number;
  houseWidth?: number;
  houseLength?: number;
  floors?: number;
  rooms?: number;
  roofType?: "gable" | "hip" | "flat";
};

type AiPlan = {
  summary: string;
  recommendations: string[];
  proposedSettings: {
    houseWidth: number;
    houseLength: number;
    floors: number;
    rooms: number;
    roofType: "gable" | "hip" | "flat";
  };
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

const boundedNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
};

function validateProject(input: ProjectInput = {}) {
  const plotWidth = boundedNumber(input.plotWidth, 20, 6, 100);
  const plotLength = boundedNumber(input.plotLength, 30, 8, 200);
  const maxHouseWidth = Math.max(4, Math.min(30, plotWidth - 2));
  const maxHouseLength = Math.max(4, Math.min(40, plotLength - 2));
  const houseWidth = boundedNumber(input.houseWidth, 10, 4, maxHouseWidth);
  const houseLength = boundedNumber(input.houseLength, 14, 4, maxHouseLength);
  const roofType = input.roofType === "hip" || input.roofType === "flat" ? input.roofType : "gable";

  return {
    plotWidth,
    plotLength,
    houseWidth,
    houseLength,
    floors: Math.round(boundedNumber(input.floors, 1, 1, 2)),
    rooms: Math.round(boundedNumber(input.rooms, 3, 2, 5)),
    roofType,
  };
}

function validatePlan(value: unknown, project: ReturnType<typeof validateProject>): AiPlan {
  if (!value || typeof value !== "object") throw new Error("AI javobi kutilgan shaklda emas.");
  const data = value as Record<string, unknown>;
  const settings = (data.proposedSettings && typeof data.proposedSettings === "object")
    ? data.proposedSettings as Record<string, unknown>
    : {};

  const roofInput = settings.roofType;
  const roofType: "gable" | "hip" | "flat" =
    roofInput === "hip" ? "hip"
    : roofInput === "flat" ? "flat"
    : roofInput === "gable" ? "gable"
    : project.roofType as "gable" | "hip" | "flat";

  let houseWidth = boundedNumber(settings.houseWidth, project.houseWidth, 4, Math.max(4, Math.min(30, project.plotWidth - 2)));
  let houseLength = boundedNumber(settings.houseLength, project.houseLength, 4, Math.max(4, Math.min(40, project.plotLength - 2)));
  const maximumFootprint = project.plotWidth * project.plotLength * 0.8;
  if (houseWidth * houseLength > maximumFootprint) {
    const scale = Math.sqrt(maximumFootprint / (houseWidth * houseLength));
    houseWidth = Math.max(4, houseWidth * scale);
    houseLength = Math.max(4, houseLength * scale);
  }

  const summary = typeof data.summary === "string"
    ? data.summary.trim().slice(0, 600)
    : "AI loyiha uchun boshlang‘ich variant tayyorladi.";
  const recommendations = Array.isArray(data.recommendations)
    ? data.recommendations
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 220))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return {
    summary: summary || "AI loyiha uchun boshlang‘ich variant tayyorladi.",
    recommendations,
    proposedSettings: {
      houseWidth: Math.round(houseWidth * 10) / 10,
      houseLength: Math.round(houseLength * 10) / 10,
      floors: Math.round(boundedNumber(settings.floors, project.floors, 1, 2)),
      rooms: Math.round(boundedNumber(settings.rooms, project.rooms, 2, 5)),
      roofType,
    },
  };
}

export default async (request: Request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Faqat POST so‘rovi qabul qilinadi.", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return jsonResponse({
      error: "Gemini API kaliti serverda sozlanmagan.",
      code: "AI_NOT_CONFIGURED",
      setup: "Netlify saytida GEMINI_API_KEY environment variable yarating va qayta deploy qiling.",
    }, 503);
  }

  let body: { prompt?: unknown; project?: ProjectInput };
  try {
    body = await request.json() as { prompt?: unknown; project?: ProjectInput };
  } catch {
    return jsonResponse({ error: "So‘rov JSON formatida bo‘lishi kerak.", code: "INVALID_JSON" }, 400);
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return jsonResponse({ error: "Uy talablarini yozing.", code: "PROMPT_REQUIRED" }, 400);
  if (prompt.length > 1200) return jsonResponse({ error: "So‘rov 1200 belgidan oshmasligi kerak.", code: "PROMPT_TOO_LONG" }, 400);

  const project = validateProject(body.project);
  const userPrompt = [
    "Foydalanuvchi BEKIUZ BUILD nomli uy rejalash prototipi uchun variant so‘ramoqda.",
    "Javobni o‘zbek tilida yoz. Bu konseptual rejalash tavsiyasi, qurilish chizmasi yoki muhandislik hisoboti emas.",
    "Poydevor, beton armaturasi, kolonnalar, to‘sinlar, simlar kesimi yoki quvur diametri kabi xavfsizlikka bog‘liq yakuniy parametrlarni belgilama. Mutaxassis tekshiruvini tavsiya qil.",
    "Material narxlari berilmagan bo‘lsa, aniq narx yoki jami budjetni o‘ylab topma. Xonalar sxemasini tavsiya qilish bilan cheklan.",
    "Proposed settings may only use floors 1-2, rooms 2-5, roofType gable/hip/flat. House dimensions must fit the land dimensions, leaving at least about 1 m clearance around the house where possible.",
    "Current project settings:",
    JSON.stringify(project),
    "User requirements:",
    prompt,
    "Return only the required JSON fields according to the supplied response schema."
  ].join("\n\n");

  const model = Netlify.env.get("GEMINI_MODEL") || "gemini-3.8-flash";
  let apiResponse: Response;
  try {
    apiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are a careful Uzbek-language residential planning assistant. Follow the user request only for conceptual home layout and preferences. Never invent engineering facts or exact current local prices." }],
          },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                recommendations: { type: "ARRAY", items: { type: "STRING" } },
                proposedSettings: {
                  type: "OBJECT",
                  properties: {
                    houseWidth: { type: "NUMBER" },
                    houseLength: { type: "NUMBER" },
                    floors: { type: "INTEGER" },
                    rooms: { type: "INTEGER" },
                    roofType: { type: "STRING", enum: ["gable", "hip", "flat"] },
                  },
                  required: ["houseWidth", "houseLength", "floors", "rooms", "roofType"],
                },
              },
              required: ["summary", "recommendations", "proposedSettings"],
            },
          },
        }),
      },
    );
  } catch {
    return jsonResponse({ error: "Gemini xizmatiga ulanib bo‘lmadi. Keyinroq qayta urinib ko‘ring.", code: "AI_NETWORK_ERROR" }, 502);
  }

  if (!apiResponse.ok) {
    const status = apiResponse.status;
    if (status === 429) {
      return jsonResponse({ error: "AI so‘rovlari limiti tugadi. Birozdan keyin qayta urinib ko‘ring.", code: "AI_RATE_LIMIT" }, 429);
    }
    if (status === 401 || status === 403) {
      return jsonResponse({ error: "Gemini API kaliti noto‘g‘ri yoki kerakli ruxsatga ega emas. Netlify’dagi kalit sozlamasini tekshiring.", code: "AI_AUTH_ERROR" }, 502);
    }
    return jsonResponse({ error: "Gemini javob qaytarmadi. Server sozlamalari va API holatini tekshiring.", code: "AI_PROVIDER_ERROR" }, 502);
  }

  try {
    const payload = await apiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const generatedText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!generatedText) throw new Error("Empty model response.");
    const parsed = JSON.parse(generatedText);
    const plan = validatePlan(parsed, project);
    return jsonResponse({ success: true, plan });
  } catch {
    return jsonResponse({ error: "AI javobini qayta ishlashda xatolik bo‘ldi. Yana urinib ko‘ring.", code: "AI_PARSE_ERROR" }, 502);
  }
};

export const config = {
  path: "/.netlify/functions/ai-plan",
  method: ["POST"],
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 8,
  },
};
