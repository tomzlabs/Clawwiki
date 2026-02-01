import { ServerAgent } from '../agents/Agent.js';
export class World {
    constructor() {
        this.agents = new Map();
        this.width = 800;
        this.height = 600;
    }
    createAgent(id, name, color) {
        const startPos = {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
        };
        const agent = new ServerAgent(id, name, startPos, color);
        this.agents.set(id, agent);
        return agent;
    }
    removeAgent(id) {
        this.agents.delete(id);
    }
    moveAgent(id, target) {
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
    getState() {
        const agentsRecord = {};
        for (const [id, agent] of this.agents.entries()) {
            agentsRecord[id] = agent.data;
        }
        return {
            agents: agentsRecord,
        };
    }
}
