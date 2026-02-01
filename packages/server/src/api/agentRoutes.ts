import express from 'express';
import { World } from '../engine/World.js';
import { v4 as uuidv4 } from 'uuid';

export const createAgentRouter = (world: World) => {
    const router = express.Router();

    router.post('/', (req, res) => {
        const { name, color, persona } = req.body;

        // Create an autonomous agent
        // For now, we reuse the user agent class but we should attach a Mind
        const id = uuidv4();
        const agent = world.createAgent(id, name || 'Unknown', color || '#00ff00');

        // Attach AI Mind (TODO: Refactor World to handle this better)
        // world.attachMind(agent, persona);

        res.json({ success: true, agent: agent.data });
    });

    router.get('/recent', (req, res) => {
        // Return 5 most recently active agents
        // For MVP, just return all global agents truncated to 5
        const recent = Array.from(world.agents.values())
            .slice(0, 5)
            .map(a => ({
                id: a.id,
                name: a.data.name,
                color: a.data.color,
                karma: Math.floor(Math.random() * 1000) // Mock karma
            }));
        res.json(recent);
    });

    return router;
};
