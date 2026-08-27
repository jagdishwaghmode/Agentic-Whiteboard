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
    // Never silently generate a misleading template when a configured provider is down.
    throw new Error(providerError);
  }

  // Graceful Dynamic Fallback Generator for dev mode or invalid key
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
  // Planner requests append intent JSON; only use the user's text for naming.
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
    title: `${titleSubject} Microservices`, diagramType: requestedType, direction: 'LEFT_TO_RIGHT',
    groups: [{ id: 'edge', label: 'Edge', description: 'Ingress' }, { id: 'services', label: 'Services', description: 'Independent domain services' }, { id: 'platform', label: 'Platform', description: 'Shared infrastructure' }],
    nodes: [{ id: 'client', label: 'Web & Mobile Clients', type: 'client', group: 'edge' }, { id: 'gateway', label: 'API Gateway', type: 'gateway', group: 'edge' }, { id: 'service_a', label: 'Domain Service A', type: 'service', group: 'services' }, { id: 'service_b', label: 'Domain Service B', type: 'service', group: 'services' }, { id: 'queue', label: 'Event Bus', type: 'queue', group: 'platform' }, { id: 'db', label: 'Service Databases', type: 'database', group: 'platform' }],
    relationships: [{ from: 'client', to: 'gateway', label: 'HTTPS', type: 'request' }, { from: 'gateway', to: 'service_a', label: 'Route', type: 'request' }, { from: 'gateway', to: 'service_b', label: 'Route', type: 'request' }, { from: 'service_a', to: 'queue', label: 'Events', type: 'data' }, { from: 'service_b', to: 'db', label: 'Persist', type: 'data' }],
  };

  if (requestedType === 'deployment-architecture') return {
    title: `${titleSubject} Deployment`, diagramType: requestedType, direction: 'TOP_TO_BOTTOM',
    groups: [{ id: 'internet', label: 'Internet', description: 'External users' }, { id: 'cluster', label: 'Runtime Cluster', description: 'Deployed workloads' }, { id: 'managed', label: 'Managed Services', description: 'Hosted dependencies' }],
    nodes: [{ id: 'users', label: 'Users', type: 'external-system', group: 'internet' }, { id: 'ingress', label: 'Load Balancer', type: 'gateway', group: 'cluster' }, { id: 'app', label: 'Application Pods', type: 'service', group: 'cluster' }, { id: 'database', label: 'Managed Database', type: 'database', group: 'managed' }, { id: 'monitoring', label: 'Monitoring & Logs', type: 'service', group: 'managed' }],
    relationships: [{ from: 'users', to: 'ingress', label: 'HTTPS', type: 'request' }, { from: 'ingress', to: 'app', label: 'Route', type: 'request' }, { from: 'app', to: 'database', label: 'Query', type: 'data' }, { from: 'app', to: 'monitoring', label: 'Telemetry', type: 'data' }],
  };

  if (/\bnetflix\b/.test(lower) && lower.length < 90) {
    return {
      title: 'High-Level Netflix System Architecture',
      diagramType: requestedType,
      direction: 'TOP_TO_BOTTOM',
      groups: [
        { id: 'client-layer', label: 'Client Layer', description: 'Smart TV, Web, & Mobile Apps' },
        { id: 'app-layer', label: 'Core Services Layer', description: 'API Gateway & Microservices' },
        { id: 'data-layer', label: 'Data & Content Layer', description: 'CDN, Transcoding, & DB' },
      ],
      nodes: [
        { id: 'clients', label: 'Web & Mobile Apps', description: 'Customer Apps', type: 'client', group: 'client-layer' },
        { id: 'cdn', label: 'Open Connect CDN', description: 'Video Streaming CDN', type: 'service', group: 'client-layer' },
        { id: 'api_gateway', label: 'Zuul API Gateway', description: 'Edge Routing', type: 'gateway', group: 'app-layer' },
        { id: 'auth_service', label: 'Auth & User Service', description: 'JWT Authentication', type: 'service', group: 'app-layer' },
        { id: 'playback', label: 'Playback Service', description: 'Video Delivery API', type: 'service', group: 'app-layer' },
        { id: 'recommendation', label: 'Recommendation Engine', description: 'ML Personalization', type: 'service', group: 'app-layer' },
        { id: 'database', label: 'Cassandra DB Cluster', description: 'User & Video Metadata', type: 'database', group: 'data-layer' },
        { id: 's3_storage', label: 'S3 Transcoded Video Store', description: 'Video Chunks Store', type: 'database', group: 'data-layer' },
      ],
      relationships: [
        { from: 'clients', to: 'api_gateway', label: 'HTTPS Requests', type: 'request' },
        { from: 'clients', to: 'cdn', label: 'Stream Video', type: 'data' },
        { from: 'api_gateway', to: 'auth_service', label: 'Verify Token', type: 'route' },
        { from: 'api_gateway', to: 'playback', label: 'Fetch Stream URL', type: 'route' },
        { from: 'api_gateway', to: 'recommendation', label: 'Fetch Recommendations', type: 'route' },
        { from: 'playback', to: 'database', label: 'Metadata Query', type: 'data' },
        { from: 'playback', to: 's3_storage', label: 'Fetch Master Chunks', type: 'data' },
      ],
    };
  }

  if (/\byoutube\b/.test(lower) && lower.length < 90) {
    return {
      title: 'High-Level YouTube Architecture',
      diagramType: requestedType,
      direction: 'TOP_TO_BOTTOM',
      groups: [
        { id: 'client-layer', label: 'Client Layer', description: 'Web, Mobile, & TV Clients' },
        { id: 'services-layer', label: 'Processing & Streaming Services', description: 'Upload, Transcode, & Search' },
        { id: 'storage-layer', label: 'Global Data & Media Storage', description: 'Video Store & Bigtable DB' },
      ],
      nodes: [
        { id: 'youtube_client', label: 'YouTube Apps & Web', description: 'Client Apps', type: 'client', group: 'client-layer' },
        { id: 'google_cdn', label: 'Google Global Edge CDN', description: 'Video Edge Cache', type: 'service', group: 'client-layer' },
        { id: 'api_gateway', label: 'API Gateway & Load Balancer', description: 'Traffic Ingress', type: 'gateway', group: 'services-layer' },
        { id: 'video_upload', label: 'Video Upload Service', description: 'Chunk Upload Handler', type: 'service', group: 'services-layer' },
        { id: 'encoder', label: 'Video Transcoder Service', description: 'Multi-resolution Encoding', type: 'service', group: 'services-layer' },
        { id: 'search_service', label: 'Search & Recommendation', description: 'Indexing & Ranking Engine', type: 'service', group: 'services-layer' },
        { id: 'bigtable', label: 'Bigtable & Spanner DB', description: 'Metadata & Comments Store', type: 'database', group: 'storage-layer' },
        { id: 'gcs_video', label: 'Google Cloud Video Storage', description: 'Raw & Encoded Video Storage', type: 'database', group: 'storage-layer' },
      ],
      relationships: [
        { from: 'youtube_client', to: 'api_gateway', label: 'API & Upload Calls', type: 'request' },
        { from: 'youtube_client', to: 'google_cdn', label: 'Stream Video', type: 'data' },
        { from: 'api_gateway', to: 'video_upload', label: 'Upload Route', type: 'route' },
        { from: 'api_gateway', to: 'search_service', label: 'Search Queries', type: 'route' },
        { from: 'video_upload', to: 'encoder', label: 'Transcode Event', type: 'data' },
        { from: 'encoder', to: 'gcs_video', label: 'Save Encoded Chunks', type: 'data' },
        { from: 'search_service', to: 'bigtable', label: 'Query Index', type: 'data' },
      ],
    };
  }

  // General fallback for custom prompts
  const domain = lower.includes('food') || lower.includes('delivery')
    ? { client: 'Customer App', service: 'Order & Dispatch Service', gateway: 'Restaurant / Driver Integrations', database: 'Orders & Menus Database' }
    : lower.includes('e-commerce') || lower.includes(' ecommerce') || lower.includes('shop')
      ? { client: 'Storefront Web & Mobile', service: 'Catalog & Checkout Services', gateway: 'Payment Provider', database: 'Products & Orders Database' }
      : lower.includes('bank') || lower.includes('payment')
        ? { client: 'Banking Channels', service: 'Transaction & Risk Services', gateway: 'Core Banking Integration', database: 'Accounts & Ledger Database' }
        : lower.includes('health') || lower.includes('hospital')
          ? { client: 'Patient & Staff Apps', service: 'Care Coordination Services', gateway: 'Provider Integrations', database: 'Patient Records Database' }
          : { client: `${titleSubject} Client`, service: `${titleSubject} Core Services`, gateway: 'External Integrations', database: `${titleSubject} Data Store` };

  return {
    title: `${titleSubject} Architecture`,
    diagramType: requestedType,
    direction: 'TOP_TO_BOTTOM',
    groups: [
      { id: 'frontend-layer', label: 'Client Layer', description: 'User applications' },
      { id: 'backend-layer', label: 'Services Layer', description: 'Core business logic' },
      { id: 'storage-layer', label: 'Data Layer', description: 'Persistence and cache' },
    ],
    nodes: [
      { id: 'app_client', label: domain.client, description: 'User-facing application', type: 'client', group: 'frontend-layer' },
      { id: 'api_gateway', label: domain.gateway, description: 'Boundary and integrations', type: 'gateway', group: 'backend-layer' },
      { id: 'app_service', label: domain.service, description: 'Domain business logic', type: 'service', group: 'backend-layer' },
      { id: 'app_db', label: domain.database, description: 'Persistent domain data', type: 'database', group: 'storage-layer' },
    ],
    relationships: [
      { from: 'app_client', to: 'api_gateway', label: 'HTTPS Requests', type: 'request' },
      { from: 'api_gateway', to: 'app_service', label: 'Route Calls', type: 'route' },
      { from: 'app_service', to: 'app_db', label: 'Query / Store', type: 'data' },
    ],
  };
}

export async function analyzeDiagramIntent(prompt) {
  return callGeminiJSON(INTENT_SYSTEM_PROMPT, prompt);
}

export async function planDiagram(prompt, intent) {
  const flowDirective = ['flowchart', 'workflow', 'process-flow'].includes(intent?.diagramType)
    ? '\n\nFLOWCHART DIRECTIVE: derive 8-14 high-level stages from the named project or process. Do not return a 3-5 node generic Start/Process/End chain. Use meaningful project-specific labels with one readable vertical primary path and horizontal side branches for parallel subprocesses and alternate outcomes.'
    : '';
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
