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
    console.warn('Gemini config warning:', err.message);
  }

  if (config?.apiKey && !config.apiKey.includes('your_') && !config.apiKey.includes('your-')) {
    const candidateModels = [
      config.model || 'gemini-3.6-flash',
      'gemini-3.6-flash',
      'gemini-flash-latest',
      'gemini-3.7-flash',
    ];

    const uniqueModels = [...new Set(candidateModels)];
    let lastError = null;

    for (const model of uniqueModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
        const promptText = `${systemInstruction}\n\nUser Request / Content:\n${
          typeof userContent === 'string' ? userContent : JSON.stringify(userContent)
        }`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: promptText }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const sanitized = sanitizeAIResponse(rawText);
            return JSON.parse(sanitized);
          }
        } else {
          const errText = await response.text();
          lastError = new Error(`Google Gemini API Error (${response.status}): ${errText}`);
          console.warn(`[Gemini] Model ${model} failed with status ${response.status}. Trying next candidate...`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini] Model ${model} request error: ${err.message}. Trying next candidate...`);
      }
    }

    if (lastError) {
      console.error('[Gemini] All candidate models failed:', lastError.message);
    }
  }

  // Graceful Dynamic Fallback Generator for dev mode or offline network
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

  // If executing Intent Prompt
  if (systemInstruction.includes('intent analyzer')) {
    return {
      diagramType: requestedType,
      domain: requestedType.includes('architecture') ? 'software-architecture' : 'general',
      abstractionLevel: requestedType.includes('architecture') ? 'high' : 'medium',
      direction: ['sequence-diagram', 'mind-map', 'entity-relationship-diagram'].includes(requestedType) ? 'LEFT_TO_RIGHT' : 'TOP_TO_BOTTOM',
    };
  }

  // If executing Reviewer Prompt
  if (systemInstruction.includes('quality reviewer')) {
    try {
      const parsed = JSON.parse(userContent);
      if (parsed.proposedDiagram) return parsed.proposedDiagram;
    } catch {}
  }

  // Planner Prompt / Semantic Generator
  const userText = contentStr.split(/\n\s*Intent Metadata:/i)[0];
  const promptExtract = userText
    .replace(/\b(create|generate|flowchart|workflow|architecture|diagram|with|proper|details|about|for|a|an|the)\b/gi, '')
    .trim();
  const titleSubject = promptExtract ? promptExtract.charAt(0).toUpperCase() + promptExtract.slice(1) : 'System';

  if (['flowchart', 'workflow', 'process-flow'].includes(requestedType)) {
    return {
      title: `${titleSubject} Flowchart`, diagramType: requestedType, direction: 'TOP_TO_BOTTOM', groups: [],
      nodes: [
        { id: 'start', label: 'Start', type: 'start', group: null },
        { id: 'discover', label: 'Capture requirements', type: 'process', group: null },
        { id: 'validate', label: 'Validate input', type: 'process', group: null },
        { id: 'approved', label: 'Requirements approved?', type: 'decision', group: null },
        { id: 'prepare', label: 'Prepare project data', type: 'process', group: null },
        { id: 'execute', label: 'Execute core workflow', type: 'process', group: null },
        { id: 'verify', label: 'Verify result', type: 'process', group: null },
        { id: 'retry', label: 'Handle exception or retry', type: 'process', group: null },
        { id: 'complete', label: 'Publish outcome', type: 'process', group: null },
        { id: 'end', label: 'End', type: 'end', group: null },
      ],
      relationships: [
        { from: 'start', to: 'discover', label: '', type: 'flow' }, { from: 'discover', to: 'validate', label: '', type: 'flow' }, { from: 'validate', to: 'approved', label: '', type: 'flow' },
        { from: 'approved', to: 'prepare', label: 'Yes', type: 'branch' }, { from: 'approved', to: 'discover', label: 'No — revise', type: 'branch' },
        { from: 'prepare', to: 'execute', label: '', type: 'flow' }, { from: 'execute', to: 'verify', label: '', type: 'flow' }, { from: 'verify', to: 'retry', label: 'Failure', type: 'branch' }, { from: 'retry', to: 'execute', label: 'Retry', type: 'branch' }, { from: 'verify', to: 'complete', label: 'Success', type: 'branch' }, { from: 'complete', to: 'end', label: '', type: 'flow' },
      ],
    };
  }

  if (requestedType === 'sequence-diagram') return { title: `${titleSubject} Sequence`, diagramType: requestedType, direction: 'LEFT_TO_RIGHT', groups: [], nodes: [{ id: 'user', label: 'User', type: 'external-system', group: null }, { id: 'system', label: 'System', type: 'service', group: null }, { id: 'store', label: 'Data Store', type: 'database', group: null }], relationships: [{ from: 'user', to: 'system', label: '1. Request', type: 'message' }, { from: 'system', to: 'store', label: '2. Read / write', type: 'message' }, { from: 'system', to: 'user', label: '3. Response', type: 'message' }] };
  if (requestedType === 'entity-relationship-diagram') return { title: `${titleSubject} Data Model`, diagramType: requestedType, direction: 'LEFT_TO_RIGHT', groups: [], nodes: [{ id: 'primary', label: 'Primary Entity', type: 'entity', group: null }, { id: 'related', label: 'Related Entity', type: 'entity', group: null }], relationships: [{ from: 'primary', to: 'related', label: '1 : many', type: 'relationship' }] };
  if (requestedType === 'mind-map') return { title: `${titleSubject} Mind Map`, diagramType: requestedType, direction: 'LEFT_TO_RIGHT', groups: [], nodes: [{ id: 'topic', label: titleSubject, type: 'topic', group: null }, { id: 'idea_one', label: 'Key idea 1', type: 'topic', group: null }, { id: 'idea_two', label: 'Key idea 2', type: 'topic', group: null }], relationships: [{ from: 'topic', to: 'idea_one', label: '', type: 'branch' }, { from: 'topic', to: 'idea_two', label: '', type: 'branch' }] };

  if (requestedType === 'microservices-architecture') return {
    title: `${titleSubject} Microservices Architecture`, diagramType: requestedType, direction: 'LEFT_TO_RIGHT',
    groups: [
      { id: 'edge-layer', label: 'Client & Edge Layer', description: 'Ingress & Clients' },
      { id: 'services-layer', label: 'Domain Microservices', description: 'Core Business APIs' },
      { id: 'data-layer', label: 'Data & Event Infrastructure', description: 'Databases & Message Brokers' }
    ],
    nodes: [
      { id: 'web_client', label: 'Web Application', type: 'client', group: 'edge-layer' },
      { id: 'mobile_client', label: 'Mobile App', type: 'client', group: 'edge-layer' },
      { id: 'api_gw', label: 'API Gateway', type: 'gateway', group: 'edge-layer' },
      { id: 'auth_svc', label: 'Authentication Service', type: 'service', group: 'services-layer' },
      { id: 'core_svc', label: `${titleSubject} Service`, type: 'service', group: 'services-layer' },
      { id: 'notify_svc', label: 'Notification Service', type: 'service', group: 'services-layer' },
      { id: 'cache_store', label: 'Redis Cache', type: 'cache', group: 'data-layer' },
      { id: 'event_bus', label: 'Event Queue / Kafka', type: 'queue', group: 'data-layer' },
      { id: 'primary_db', label: 'Primary SQL/NoSQL DB', type: 'database', group: 'data-layer' }
    ],
    relationships: [
      { from: 'web_client', to: 'api_gw', label: 'HTTPS / REST', type: 'request' },
      { from: 'mobile_client', to: 'api_gw', label: 'HTTPS / GraphQL', type: 'request' },
      { from: 'api_gw', to: 'auth_svc', label: 'Verify JWT', type: 'request' },
      { from: 'api_gw', to: 'core_svc', label: 'Route Request', type: 'request' },
      { from: 'core_svc', to: 'cache_store', label: 'Cache Lookup', type: 'data' },
      { from: 'core_svc', to: 'primary_db', label: 'Read/Write', type: 'data' },
      { from: 'core_svc', to: 'event_bus', label: 'Publish Event', type: 'data' },
      { from: 'event_bus', to: 'notify_svc', label: 'Consume Event', type: 'data' }
    ],
  };

  // High-Level Architecture Default
  return {
    title: `${titleSubject} System Architecture`,
    diagramType: requestedType,
    direction: 'LEFT_TO_RIGHT',
    groups: [
      { id: 'client-layer', label: 'Client & Presentation Layer', description: 'User Interfaces' },
      { id: 'gateway-layer', label: 'API & Gateway Layer', description: 'Ingress & Security' },
      { id: 'services-layer', label: 'Core Services Layer', description: 'Business Logic' },
      { id: 'storage-layer', label: 'Data & Persistence Layer', description: 'Storage & Caching' },
    ],
    nodes: [
      { id: 'client_ui', label: `${titleSubject} Web UI`, description: 'User interface', type: 'client', group: 'client-layer' },
      { id: 'api_gateway', label: 'API Gateway & Load Balancer', description: 'Traffic routing', type: 'gateway', group: 'gateway-layer' },
      { id: 'auth_service', label: 'Auth & Session Service', description: 'Token validation', type: 'service', group: 'services-layer' },
      { id: 'core_service', label: `${titleSubject} Core Engine`, description: 'Domain logic', type: 'service', group: 'services-layer' },
      { id: 'worker_service', label: 'Background Worker', description: 'Async tasks', type: 'service', group: 'services-layer' },
      { id: 'cache_layer', label: 'In-Memory Cache', description: 'Fast session cache', type: 'cache', group: 'storage-layer' },
      { id: 'main_db', label: 'Primary Database', description: 'Persistent records', type: 'database', group: 'storage-layer' },
    ],
    relationships: [
      { from: 'client_ui', to: 'api_gateway', label: 'HTTPS / REST', type: 'request' },
      { from: 'api_gateway', to: 'auth_service', label: 'Validate Token', type: 'route' },
      { from: 'api_gateway', to: 'core_service', label: 'Route Calls', type: 'route' },
      { from: 'core_service', to: 'cache_layer', label: 'Session Lookup', type: 'data' },
      { from: 'core_service', to: 'main_db', label: 'Query / Persist', type: 'data' },
      { from: 'core_service', to: 'worker_service', label: 'Queue Async Jobs', type: 'data' },
    ],
  };
}

export async function analyzeDiagramIntent(prompt) {
  return callGeminiJSON(INTENT_SYSTEM_PROMPT, prompt);
}

export async function planDiagram(prompt, intent) {
  const flowDirective = ['flowchart', 'workflow', 'process-flow'].includes(intent?.diagramType)
    ? '\n\nFLOWCHART DIRECTIVE: derive 8-14 high-level stages from the named project or process. Do not return a 3-5 node generic Start/Process/End chain. Use meaningful project-specific labels with one readable vertical primary path and horizontal side branches for parallel subprocesses and alternate outcomes.'
    : '\n\nARCHITECTURE DIRECTIVE: generate a production-grade high-level architecture with 8-15 distinct, meaningful components organized across logical layer groups (e.g. Client Layer, Gateway/Edge, Core Services, and Data/Storage). Do not return an oversimplified 3-node diagram.';
  const userContent = `${prompt}${flowDirective}\n\nIntent Metadata: ${JSON.stringify(intent)}`;
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
