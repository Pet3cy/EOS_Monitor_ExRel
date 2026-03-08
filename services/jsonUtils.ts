export function extractJSON(rawText: string): unknown {
  try { return JSON.parse(rawText.trim()); } catch {}
  
  const stripped = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  
  const match = rawText.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  
  throw new Error('Could not extract valid JSON from model response. Raw: ' + rawText.substring(0, 200));
}
