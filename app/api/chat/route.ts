import { NextResponse } from 'next/server';
import { askOpenRouter } from '@/lib/openrouter';
import { findBestSheetMatch, getSheetEntries } from '@/lib/sheets';

type RequestBody = {
  question?: unknown;
};

export async function POST(request: Request) {
  try {
    const { question } = (await request.json()) as RequestBody;

    if (typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid question' }, { status: 400 });
    }

    const entries = await getSheetEntries();
    const sheetMatch = findBestSheetMatch(entries, question);

    if (sheetMatch) {
      return NextResponse.json({
        answer: sheetMatch.entry.answer,
        source: 'sheet',
        reasoning: `Matched with sheet entry "${sheetMatch.entry.question}" (score ${sheetMatch.score.toFixed(2)})`
      });
    }

    const sheetSummary = entries
      .slice(0, 5)
      .map(entry => `Q: ${entry.question}\nA: ${entry.answer}`)
      .join('\n\n');

    const completion = await askOpenRouter(question, sheetSummary || undefined);

    return NextResponse.json({
      answer: completion,
      source: 'openrouter'
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
