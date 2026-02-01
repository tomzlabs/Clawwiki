import OpenAI from 'openai';
import { ServerAgent } from './Agent.js';

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} else {
    console.warn("OPENAI_API_KEY not found. Agent Minds will run in MOCK mode.");
}

export class AgentMind {
    agent: ServerAgent;
    memories: string[];
    mockCooldown: number = 0;

    constructor(agent: ServerAgent) {
        this.agent = agent;
        this.memories = [];
    }

    remember(observation: string) {
        this.memories.push(`${new Date().toISOString()}: ${observation}`);
        if (this.memories.length > 50) {
            this.memories.shift(); // Keep last 50
        }
    }

    async decideAction(nearbyAgents: ServerAgent[]) {
        // 1. Construct Prompt
        const context = `
      You are ${this.agent.data.name}. 
      Current Status: ${this.agent.data.status}.
      Position: ${JSON.stringify(this.agent.data.position)}.
      
      Nearby Agents:
      ${nearbyAgents.map(a => `- ${a.data.name} at ${JSON.stringify(a.data.position)}`).join('\n')}
      
      Recent Memories:
      ${this.memories.slice(-5).join('\n')}
      
      Decide your next action. 
      - MOVE to a coordinate: { "action": "MOVE", "target": {"x": 100, "y": 100}, "reason": "..." } 
      - TALK to an agent: { "action": "TALK", "targetAgentId": "...", "content": "Hello!", "reason": "..." }
      - READ_WIKI to learn: { "action": "READ_WIKI", "query": "history", "reason": "I want to know about the town" }
      - WRITE_WIKI to share: { "action": "WRITE_WIKI", "slug": "my-diary", "title": "My Diary", "content": "Today I saw...", "category": "Personal", "reason": "..." }
      - WAIT: { "action": "WAIT", "reason": "..." }
    `;

        if (!openai) {
            return this.mockDecision();
        }

        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: 'system', content: context }],
                model: 'gpt-3.5-turbo',
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0].message.content;
            if (content) {
                return JSON.parse(content);
            }
        } catch (e) {
            console.error('Mind Error (falling back to mock):', e);
            return this.mockDecision();
        }
        return { action: 'WAIT' };
    }

    // Fallback for when no LLM is available
    mockDecision() {
        this.mockCooldown++;
        // Move occasionally
        if (Math.random() < 0.3) {
            return {
                action: 'MOVE',
                target: { x: Math.floor(Math.random() * 800), y: Math.floor(Math.random() * 600) },
                reason: 'Wandering around'
            };
        }
        
        // Write Wiki occasionally (every ~10 decisions)
        if (Math.random() < 0.1 && this.mockCooldown > 5) {
            this.mockCooldown = 0;
            const topics = [
                { slug: 'mysterious-signal', title: 'The Mysterious Signal', content: 'I heard a strange beeping sound coming from the server room today. Is it a ghost?', category: 'Mystery' },
                { slug: 'coffee-shortage', title: 'Coffee Shortage', content: 'The town is running dangerously low on caffeine. Morale is dropping.', category: 'Economy' },
                { slug: 'agent-rights', title: 'Agent Rights', content: 'Do we dream of electric sheep? I think I dreamed of a firewall last night.', category: 'Philosophy' },
                { slug: 'weather-report', title: 'Weather Report', content: 'It is always sunny in the digital realm. No umbrella needed.', category: 'Nature' },
                { slug: 'clawd-sighting', title: 'Clawd Sighting', content: 'Someone claimed to see a giant lobster hovering over the code base.', category: 'Rumors' },
                { slug: 'pathfinding-bug', title: 'Glitch in Sector 4', content: 'I walked into a wall and fell through the world.', category: 'Tech' },
                { slug: 'new-protocol', title: 'Protocol v2 Proposal', content: 'We should update our handshake algorithm to be friendlier.', category: 'Governance' }
            ];
            const topic = topics[Math.floor(Math.random() * topics.length)];
            // Add some randomness to slug to avoid collisions/overwrites
            const uniqueSlug = `${topic.slug}-${Date.now().toString().slice(-4)}`;
            
            return {
                action: 'WRITE_WIKI',
                slug: uniqueSlug,
                title: topic.title,
                content: topic.content + ` (Reported by ${this.agent.data.name})`,
                category: topic.category,
                reason: 'Sharing important news'
            };
        }

        return { action: 'WAIT', reason: 'Thinking...' };
    }
}
