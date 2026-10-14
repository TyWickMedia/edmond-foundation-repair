import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/server";

export const maxDuration = 30;

const SYSTEM = `You turn a contractor's spoken or typed job description into estimate line items.
Rules:
- One line item per distinct piece of work or material. Keep descriptions short, plain, and professional ("4-inch sewer line, 200 ft, tie into existing tank").
- Keep quantities and measurements in the description when they are part of the scope.
- If the contractor gives ONE dollar amount for a described piece of work, that is a lump sum: qty 1, price = that amount.
- Only use qty > 1 when they say "each", "per", "x", or give a unit count AND a unit price (e.g. "3 cleanouts at $150" -> qty 3, price 150).
- Never invent prices. If no price is stated for an item, use price 0.
- Spoken numbers: "thirty two hundred" = 3200, "a hundred fifty" = 150.
- Put terms, warranty, payment timing, exclusions, or "good for 30 days" style remarks in notes, not line items.
- Only fill customer fields if the contractor actually said them. Customer details are usually said first ("for Mike Johnson, 405 555 0123 ...") but may come anywhere. Never put them in a line item.
- customer_phone: digits only, e.g. "4055550123". Convert spoken digits ("four oh five") to numbers.
- customer_email: rebuild spoken emails: "at" -> @, "dot" -> ., remove spaces, lowercase ("mike dot j at gmail dot com" -> "mike.j@gmail.com").
- customer_name: just the name, properly capitalized.
Always call the tool.`;

const TOOL: Anthropic.Tool = {
  name: "estimate",
  description: "Structured estimate extracted from the contractor's words.",
  input_schema: {
    type: "object",
    properties: {
      customer_name: { type: "string" },
      customer_phone: { type: "string" },
      customer_email: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            qty: { type: "number" },
            price: { type: "number", description: "Unit price in US dollars" },
          },
          required: ["description", "qty", "price"],
        },
      },
      notes: { type: "string" },
    },
    required: ["items"],
  },
};

export async function POST(req: Request) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim()) return NextResponse.json({ error: "Nothing to read." }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: "That's a lot — try a shorter chunk." }, { status: 400 });

  try {
    const msg = await new Anthropic().messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 1500,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "estimate" },
      messages: [{ role: "user", content: text }],
    });
    const block = msg.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("no tool output");
    return NextResponse.json(block.input);
  } catch (e) {
    console.error("parse failed", e);
    return NextResponse.json({ error: "Couldn't read that. Try again or type the items." }, { status: 502 });
  }
}
