import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GapAnalysisResult {
  regulation_summary: string;
  jurisdiction: string;
  impact_categories: string[];
  severity_score: number;
  obligations: Array<{
    obligation_text: string;
    coverage_status: 'covered' | 'partial' | 'missing';
    severity: 'critical' | 'high' | 'medium';
    gap_title: string;
    gap_description: string;
    recommended_action: string;
  }>;
  overall_coverage_score: number;
}

export async function analyzeRegulation(
  regulatoryText: string,
  existingControls: string[],
): Promise<GapAnalysisResult> {
  const controlsContext = existingControls.length > 0
    ? `\n\nExisting Policy Controls:\n${existingControls.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    : '\n\nNo existing policy controls uploaded yet.';

  const prompt = `You are an expert regulatory compliance analyst. Analyze the following regulatory text and identify compliance obligations, then map them against existing policy controls.

Regulatory Text:
${regulatoryText}
${controlsContext}

Return a JSON object with this exact structure:
{
  "regulation_summary": "Brief 2-3 sentence summary of what this regulation requires",
  "jurisdiction": "EU|US Federal|US State|UK|Nigeria|Other",
  "impact_categories": ["data governance", "AI risk", "financial reporting", "privacy", "other"],
  "severity_score": 7,
  "obligations": [
    {
      "obligation_text": "Exact or paraphrased obligation from the regulation",
      "coverage_status": "covered|partial|missing",
      "severity": "critical|high|medium",
      "gap_title": "Short title for this gap",
      "gap_description": "Detailed description of why this is a gap",
      "recommended_action": "Specific action to remediate this gap"
    }
  ],
  "overall_coverage_score": 45
}

Rules:
- coverage_status "covered" = existing control fully addresses obligation
- coverage_status "partial" = existing control partially addresses but has gaps
- coverage_status "missing" = no existing control addresses this obligation
- severity "critical" = regulatory penalty or significant legal risk
- severity "high" = important but non-critical compliance issue
- severity "medium" = best practice or minor compliance issue
- overall_coverage_score = 0-100 percentage of obligations covered
- Identify 3-8 specific obligations from the text
- Be specific and actionable in recommended_action
- Return ONLY valid JSON, no markdown or explanation`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

  const jsonText = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(jsonText) as GapAnalysisResult;
}

export async function generateRemediationTask(
  gapTitle: string,
  gapDescription: string,
  regulatoryCitation: string,
  obligationText: string,
): Promise<{ title: string; description: string; due_date: string; priority: string }> {
  const prompt = `You are a regulatory compliance expert. Generate a specific remediation task for the following compliance gap.

Gap Title: ${gapTitle}
Gap Description: ${gapDescription}
Regulatory Citation: ${regulatoryCitation}
Obligation: ${obligationText}

Return a JSON object:
{
  "title": "Clear action-oriented task title (max 80 chars)",
  "description": "Detailed 3-4 sentence description of exactly what needs to be done, who should do it, and how to verify completion",
  "due_date": "YYYY-MM-DD (suggest realistic date 30-90 days from today: ${new Date().toISOString().split('T')[0]})",
  "priority": "critical|high|medium|low"
}

Return ONLY valid JSON.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response');
  const jsonText = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(jsonText);
}

export async function extractPolicyControls(policyText: string): Promise<Array<{
  control_text: string;
  control_category: string;
  page_number: number;
}>> {
  const prompt = `You are a compliance analyst. Extract all control statements from the following policy document. Control statements are specific requirements, procedures, or safeguards that the organization commits to implementing.

Policy Text:
${policyText.substring(0, 8000)}

Return a JSON array of controls:
[
  {
    "control_text": "The specific control statement text",
    "control_category": "data governance|AI risk|financial|privacy|security|operational|other",
    "page_number": 1
  }
]

Extract 5-20 specific control statements. Return ONLY valid JSON array.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response');
  const jsonText = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(jsonText);
}
