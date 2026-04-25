const AGENT_NAMES = [
  'Inventory Planner',
  'Market Analyst',
  'Location Scout',
  'Ops Advisor',
] as const;

type AgentName = typeof AGENT_NAMES[number];

function emptyScores(): Record<AgentName, number> {
  return {
    'Inventory Planner': 0,
    'Market Analyst': 0,
    'Location Scout': 0,
    'Ops Advisor': 0,
  };
}

function scoreText(...parts: Array<string | undefined | null>) {
  const text = parts.filter(Boolean).join(' ').toLowerCase();
  const scores = emptyScores();

  const keywordGroups: Record<AgentName, string[]> = {
    'Inventory Planner': [
      'inventory', 'restock', 'stock', 'supplier', 'supply', 'ingredient',
      'order', 'lead time', 'commodity', 'cost', 'margin impact', 'buffer',
      'creamer', 'syrup', 'milk', 'price rise', 'reorder',
    ],
    'Market Analyst': [
      'trend', 'demand', 'competitor', 'promo', 'promotion', 'bundle',
      'discount', 'pricing', 'price', 'matcha', 'menu', 'delivery',
      'tiktok', 'campaign', 'loyalty', 'customer', 'viral',
    ],
    'Location Scout': [
      'location', 'site', 'mrt', 'rental', 'rent', 'pop-up', 'popup',
      'mall', 'landlord', 'visibility', 'radius', 'catchment', 'expansion',
      'kiosk', 'opening', 'walk-in', 'walk in',
    ],
    'Ops Advisor': [
      'staff', 'staffing', 'schedule', 'shift', 'queue', 'prep', 'weekend',
      'holiday', 'peak hour', 'resource', 'operations', 'operational',
      'foot traffic', 'rush', 'service', 'throughput',
    ],
  };

  for (const [agent, keywords] of Object.entries(keywordGroups) as Array<[AgentName, string[]]>) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) scores[agent] += 2;
    }
  }

  return scores;
}

export function inferAgentLabel(item: {
  agent?: string;
  headline?: string;
  action?: string;
  detail?: string;
  reasoning?: string;
}) {
  if (item.agent && AGENT_NAMES.includes(item.agent as AgentName)) return item.agent;

  const scores = scoreText(item.headline, item.action, item.detail, item.reasoning);
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return ranked[0][1] > 0 ? ranked[0][0] : 'Market Analyst';
}
