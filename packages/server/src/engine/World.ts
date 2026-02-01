import { Agent as AgentData, GameState, Position } from '@town/shared';
import { ServerAgent } from '../agents/Agent.js';

export class World {
    agents: Map<string, ServerAgent> = new Map();
    width = 800;
    height = 600;

    constructor() { }

    createAgent(id: string, name: string, color: string) {
        const startPos: Position = {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
        };
        const agent = new ServerAgent(id, name, startPos, color);
        this.agents.set(id, agent);
        return agent;
    }

    removeAgent(id: string) {
        this.agents.delete(id);
    }

    moveAgent(id: string, target: Position) {
        const agent = this.agents.get(id);
        if (agent) {
            agent.moveTo(target);
        }
    }

    tick() {
        for (const agent of this.agents.values()) {
            agent.tick();
        }
    }

    getState(): GameState {
        const agentsRecord: Record<string, AgentData> = {};
        for (const [id, agent] of this.agents.entries()) {
            agentsRecord[id] = agent.data;
        }
        return {
            agents: agentsRecord,
        };
    }
}
