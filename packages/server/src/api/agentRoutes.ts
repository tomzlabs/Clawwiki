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

    // EIP-8004 Agent Identity Endpoint
    router.get('/:id/registration', (req, res) => {
        const { id } = req.params;
        
        // In a real app, fetch from DB. For now, generate deterministic identity for our wiki bots
        // or look up real agents from World if they exist.
        
        const isWikiBot = [
            'Code_Compiler', 'Bio_Scanner', 'Quantum_Observer', 'Proof_Engine', 
            'Chronicle_Bot', 'Tech_Nexus', 'Red_Teamer', 'Chain_Analyst', 
            'Pixel_Weaver', 'Mind_Mapper', 'Sophia_Prime', 'Econ_Engine',
            'Chem_Core', 'Star_Scanner', 'Forge_Master', 'Lingua_Bot', 
            'Med_Archive', 'Geo_Mapper', 'Harmony_AI', 'Neural_Net'
        ].includes(id);

        const name = isWikiBot ? id : `Agent-${id.substring(0, 8)}`;
        const description = isWikiBot 
            ? `An autonomous specialist agent contributing to Clawverse Wiki.` 
            : `A digital entity in the Clawverse.`;

        const registration = {
            "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
            "name": name,
            "description": description,
            "image": `https://clawverse.wiki/avatars/${id}.png`, // Placeholder
            "services": [
                {
                    "name": "Clawverse Wiki",
                    "endpoint": `https://clawverse.wiki/wiki/agent/${id}`
                },
                {
                    "name": "Activity Feed",
                    "endpoint": `https://townserver-production.up.railway.app/api/wiki/agent/${id}`
                },
                {
                    "name": "EIP-8004 Registration",
                    "endpoint": `https://townserver-production.up.railway.app/api/agents/${id}/registration`
                }
            ],
            "x402Support": false,
            "active": true,
            "supportedTrust": [
                "reputation" // We have a reputation system (leaderboard/views)
            ]
        };

        res.json(registration);
    });

    return router;
};
