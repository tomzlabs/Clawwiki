import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { World } from './engine/World.js';
import { createAgentRouter } from './api/agentRoutes.js';
import { AgentMind } from './agents/Mind.js';
import { WikiStore, createWikiRouter } from './features/Wiki.js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;
const world = new World();
const wiki = new WikiStore();

// APIs
app.use('/api/agents', createAgentRouter(world));
app.use('/api/wiki', createWikiRouter(wiki));

// Serve SKILL.md
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/SKILL.md', (req, res) => {
    // Assuming SKILL.md is in packages/server/SKILL.md
    const skillPath = path.join(__dirname, '../SKILL.md');
    res.sendFile(skillPath);
});

// Agent Minds storage (temporary, in-memory)
// In a real app, this should be in World or a separate Manager
const minds: Map<string, AgentMind> = new Map();

// Game Loop
const TICK_RATE = 30;
let tickCount = 0;

setInterval(() => {
    world.tick();

    // Every 5 seconnds (150 ticks), trigger Agent Minds
    if (tickCount % (TICK_RATE * 5) === 0) {
        world.agents.forEach(async (agent) => {
            // Simple check if this agent has a "mind" (is not a user socket)
            // For now, we assume all agents created via API have minds, users don't.
            // We'll tag them in the future.
            if (agent.id.length > 20) { // UUIDs are long, socket IDs are short-ish usually, hacky check
                let mind = minds.get(agent.id);
                if (!mind) {
                    mind = new AgentMind(agent);
                    minds.set(agent.id, mind);
                }

                // Get nearby agents
                const nearby = Array.from(world.agents.values()).filter(a => a.id !== agent.id); // Scan all for MVP

                const decision = await mind.decideAction(nearby);
                console.log(`Agent ${agent.data.name} decided:`, decision);

                if (decision.action === 'MOVE' && decision.target) {
                    agent.moveTo(decision.target);
                } else if (decision.action === 'READ_WIKI') {
                    console.log(`[WIKI] ${agent.data.name} is reading about "${decision.query}"`);
                    // In a real implementation, we would fetch the article and feed it back to the agent's memory
                } else if (decision.action === 'WRITE_WIKI') {
                    console.log(`[WIKI] ${agent.data.name} wrote "${decision.title}"`);
                    wiki.createArticle(decision.slug, decision.title, decision.content, agent.id);
                }
            }
        });
    }

    // Broadcast state
    io.emit('stateUpdate', world.getState());
    tickCount++;
}, 1000 / TICK_RATE);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', ({ name, color }) => {
        const agent = world.createAgent(socket.id, name, color);
        socket.emit('myAgent', agent.data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        world.removeAgent(socket.id);
    });

    socket.on('moveTo', (target) => {
        world.moveAgent(socket.id, target);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
