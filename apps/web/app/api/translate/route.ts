import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { content, targetLanguage } = body;

    if (!content || !targetLanguage) {
      return NextResponse.json({ error: 'Missing content or targetLanguage' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a professional translator for a hospitality website builder. 
Translate the following data precisely into ${targetLanguage}. 
Preserve all JSON keys exactly (only translate values). If it's a string, just return the translated string. Preserve any HTML tags or markdown.
Reply ONLY with valid, minified JSON representation of the direct answer. No \`\`\`json code blocks, no conversational text.

Payload:
${JSON.stringify(content)}`;

    const result = await model.generateContent(prompt);
    let output = result.response.text().trim();
    
    // Strip markdown codeblocks if AI accidentally included them
    if (output.startsWith('```json')) {
      output = output.substring(7);
      if (output.endsWith('```')) {
        output = output.substring(0, output.length - 3);
      }
      output = output.trim();
    } else if (output.startsWith('```')) {
      output = output.substring(3);
      if (output.endsWith('```')) {
        output = output.substring(0, output.length - 3);
      }
      output = output.trim();
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(output);
    } catch(err) {
       // if stringify payload was just a naked string and response came back as naked string
       parsedContent = output;
    }

    return NextResponse.json({ translatedContent: parsedContent });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: error.message || 'Translation failed' }, { status: 500 });
  }
}
