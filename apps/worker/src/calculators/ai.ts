import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import type { OperationType } from '@mathstream/shared';

const operationNames: Record<OperationType, string> = {
  add: 'addition',
  subtract: 'subtraction',
  multiply: 'multiplication',
  divide: 'division',
};

export async function calculateAI(
  operation: OperationType,
  a: number,
  b: number
): Promise<{ result: number | null; error: string | null }> {
  try {
    const operationName = operationNames[operation];
    const prompt = `Calculate the ${operationName} of ${a} and ${b}. 
Only respond with the numeric result, nothing else. 
If it's a division by zero, respond with "ERROR: Division by zero".
If the result is a decimal, round to 6 decimal places.`;

    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt,
    });

    const trimmed = text.trim();
    
    if (trimmed.startsWith('ERROR:')) {
      return { result: null, error: trimmed.replace('ERROR:', '').trim() };
    }

    const result = parseFloat(trimmed);
    if (isNaN(result)) {
      return { result: null, error: `AI returned invalid result: ${trimmed}` };
    }

    return { result, error: null };
  } catch (error) {
    return { 
      result: null, 
      error: `AI calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

