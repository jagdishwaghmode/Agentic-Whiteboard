import { getGeminiConfig } from '../config/geminiConfig.js';
import { INTENT_SYSTEM_PROMPT } from '../prompts/intentPrompt.js';
import { PLANNER_SYSTEM_PROMPT } from '../prompts/plannerPrompt.js';
import { REVIEWER_SYSTEM_PROMPT } from '../prompts/reviewerPrompt.js';
import { sanitizeAIResponse } from '../utils/sanitizeAIResponse.js';

export async function callGeminiJSON(systemInstruction, userContent) {
  let config;

  try {
    config = getGeminiConfig();
  } catch (err) {
    console.warn('AI config warning:', err.message);
  }

  if (config?.apiKey && !config.apiKey.includes('your-')) {
    let providerError = 'OpenRouter request failed';
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'AI Agentic Whiteboard',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: typeof userContent === 'string' ? userContent : JSON.stringify(userContent) },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return JSON.parse(sanitizeAIResponse(text));
      } else {
        providerError = `OpenRouter API returned ${response.status}: ${await response.text()}`;
        console.warn(providerError);
      }
    } catch (err) {
      providerError = `OpenRouter request failed: ${err.message}`;
      console.warn(providerError);
    }
    throw new Error(providerError);
  }

  return getDynamicFallbackJSON(systemInstruction, userContent);
}

function getDynamicFallbackJSON(systemInstruction, userContent) {
  const contentStr = typeof userContent === 'string' ? userContent : JSON.stringify(userContent);
  const lower = contentStr.toLowerCase();
  const requestedType = /mind[ -]?map/.test(lower) ? 'mind-map'
    : /sequence/.test(lower) ? 'sequence-diagram'
    : /entity[ -]?relationship|\ber diagram\b|database schema|data model/.test(lower) ? 'entity-relationship-diagram'
    : /workflow/.test(lower) ? 'workflow'
    : /flowchart/.test(lower) ? 'flowchart'
    : /process[ -]?flow/.test(lower) ? 'process-flow'
    : /microservice/.test(lower) ? 'microservices-architecture'
    : /deployment/.test(lower) ? 'deployment-architecture'
    : /network/.test(lower) ? 'network-architecture'
    : /cloud/.test(lower) ? 'cloud-architecture'
    : 'high-level-system-architecture';

  if (systemInstruction.includes('intent analyzer')) {
    return {
      diagramType: requestedType,
      domain: requestedType.includes('architecture') ? 'software-architecture' : 'general',
      abstractionLevel: requestedType.includes('architecture') ? 'high' : 'medium',
      direction: ['sequence-diagram', 'mind-map', 'entity-relationship-diagram'].includes(requestedType) ? 'LEFT_TO_RIGHT' : 'TOP_TO_BOTTOM',
    };
  }

  if (systemInstruction.includes('quality reviewer')) {
    try {
      const parsed = JSON.parse(userContent);
      if (parsed.proposedDiagram) return parsed.proposedDiagram;
    } catch {}
  }

  const userText = contentStr.split(/\n\s*Intent Metadata:/i)[0];
  const promptExtract = userText
    .replace(/\b(create|generate|flowchart|workflow|architecture|diagram|with|proper|details|about|for|a|an|the)\b/gi, '')
    .trim();
  const titleSubject = promptExtract ? promptExtract.charAt(0).toUpperCase() + promptExtract.slice(1) : 'System';

  if (['flowchart', 'workflow', 'process-flow'].includes(requestedType)) {
    return {
      title: `${titleSubject} Flowchart`, diagramType: requestedType, direction: 'TOP_TO_BOTTOM', groups: [],
      nodes: [
        { id: 'start', label: 'Start Process', type: 'start', group: null },
        { id: 'discover', label: 'Capture User Input', type: 'process', group: null },
        { id: 'validate', label: 'Validate Parameters', type: 'process', group: null },
        { id: 'approved', label: 'Validation Passed?', type: 'decision', group: null },
        { id: 'prepare', label: 'Prepare Processing Data', type: 'process', group: null },
        { id: 'execute', label: 'Execute Core Pipeline', type: 'process', group: null },
        { id: 'verify', label: 'Verify Processing Output', type: 'process', group: null },
        { id: 'retry', label: 'Handle Error & Retry', type: 'process', group: null },
        { id: 'complete', label: 'Publish Results', type: 'process', group: null },
        { id: 'end', label: 'End Process', type: 'end', group: null },
      ],
      relationships: [
        { from: 'start', to: 'discover', label: '', type: 'flow' },
        { from: 'discover', to: 'validate', label: '', type: 'flow' },
        { from: 'validate', to: 'approved', label: '', type: 'flow' },
        { from: 'approved', to: 'prepare', label: 'Yes', type: 'branch' },
        { from: 'approved', to: 'discover', label: 'No', type: 'branch' },
        { from: 'prepare', to: 'execute', label: '', type: 'flow' },
        { from: 'execute', to: 'verify', label: '', type: 'flow' },
        { from: 'verify', to: 'retry', label: 'Failed', type: 'branch' },
        { from: 'retry', to: 'execute', label: 'Retry', type: 'branch' },
        { from: 'verify', to: 'complete', label: 'Success', type: 'branch' },
        { from: 'complete', to: 'end', label: '', type: 'flow' },
      ],
    };
  }

  const domain = lower.includes('food') || lower.includes('delivery')
    ? { client: 'Customer App', service: 'Order Service', gateway: 'Restaurant Gateway', database: 'Orders DB' }
    : lower.includes('e-commerce') || lower.includes('shop')
      ? { client: 'Storefront App', service: 'Checkout Service', gateway: 'Payment Gateway', database: 'Products DB' }
      : lower.includes('bank') || lower.includes('payment')
        ? { client: 'Banking App', service: 'Ledger Service', gateway: 'Core Banking API', database: 'Accounts DB' }
        : { client: `${titleSubject} Web Client`, service: `${titleSubject} Core Service`, gateway: 'API Gateway', database: `${titleSubject} Main DB` };

  return {
    title: `High-Level ${titleSubject} Architecture`,
    diagramType: requestedType,
    direction: 'TOP_TO_BOTTOM',
    groups: [
      { id: 'frontend-layer', label: 'Frontend Layer', description: 'Client applications' },
      { id: 'backend-layer', label: 'API & Gateway Layer', description: 'Business logic & API routes' },
      { id: 'processing-layer', label: 'Core Processing & AI Services', description: 'Background engines & workers' },
      { id: 'storage-layer', label: 'Data & Persistence Layer', description: 'Databases & caches' },
    ],
    nodes: [
      { id: 'client_web', label: domain.client, type: 'client', group: 'frontend-layer' },
      { id: 'client_mobile', label: `${titleSubject} Mobile App`, type: 'client', group: 'frontend-layer' },
      { id: 'api_gateway', label: domain.gateway, type: 'gateway', group: 'backend-layer' },
      { id: 'auth_service', label: 'Authentication Service', type: 'service', group: 'backend-layer' },
      { id: 'core_service', label: domain.service, type: 'service', group: 'backend-layer' },
      { id: 'file_handler', label: 'File Upload & Parser', type: 'service', group: 'backend-layer' },
      { id: 'processor', label: 'Core Processing Engine', type: 'service', group: 'processing-layer' },
      { id: 'ai_engine', label: 'AI Analytics Engine', type: 'service', group: 'processing-layer' },
      { id: 'event_bus', label: 'Message Queue & Event Bus', type: 'queue', group: 'processing-layer' },
      { id: 'primary_db', label: domain.database, type: 'database', group: 'storage-layer' },
      { id: 'cache_store', label: 'Redis Cache Layer', type: 'cache', group: 'storage-layer' },
      { id: 'media_store', label: 'Object Storage (S3)', type: 'database', group: 'storage-layer' },
    ],
    relationships: [
      { from: 'client_web', to: 'api_gateway', label: 'HTTPS Request', type: 'request' },
      { from: 'client_mobile', to: 'api_gateway', label: 'HTTPS Request', type: 'request' },
      { from: 'api_gateway', to: 'auth_service', label: 'Verify Token', type: 'request' },
      { from: 'api_gateway', to: 'core_service', label: 'Dispatch Route', type: 'route' },
      { from: 'api_gateway', to: 'file_handler', label: 'Upload Stream', type: 'route' },
      { from: 'core_service', to: 'cache_store', label: 'Cache Lookup', type: 'data' },
      { from: 'core_service', to: 'primary_db', label: 'CRUD Query', type: 'data' },
      { from: 'file_handler', to: 'media_store', label: 'Store File', type: 'data' },
      { from: 'file_handler', to: 'event_bus', label: 'Publish Event', type: 'data' },
      { from: 'event_bus', to: 'processor', label: 'Trigger Job', type: 'data' },
      { from: 'processor', to: 'ai_engine', label: 'Analyze Data', type: 'data' },
      { from: 'ai_engine', to: 'primary_db', label: 'Save Analysis', type: 'data' },
    ],
  };
}

export async function analyzeDiagramIntent(prompt) {
  return callGeminiJSON(INTENT_SYSTEM_PROMPT, prompt);
}

export async function planDiagram(prompt, intent) {
  const userContent = `${prompt}\n\nIntent Metadata: ${JSON.stringify(intent)}`;
  return callGeminiJSON(PLANNER_SYSTEM_PROMPT, userContent);
}

export async function reviewDiagram(prompt, intent, plannedDiagram) {
  const userContent = JSON.stringify({
    userPrompt: prompt,
    intent,
    proposedDiagram: plannedDiagram,
  });
  return callGeminiJSON(REVIEWER_SYSTEM_PROMPT, userContent);
}

export default {
  callGeminiJSON,
  analyzeDiagramIntent,
  planDiagram,
  reviewDiagram,
};
