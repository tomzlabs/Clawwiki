import { Agent as AgentData, Position } from '@town/shared';
// import { AgentMind } from './Mind.js'; // Circular dependency risk, let's inject it or keep it simple

export class ServerAgent {
    id: string;
    data: AgentData;
    targetPosition: Position | null = null;
    speed: number = 2; // pixels per tick
    // mind: AgentMind; 

    constructor(id: string, name: string, startPos: Position, color: string) {
        this.id = id;
        this.data = {
            id,
            name,
            position: startPos,
            color,
            status: 'Idle'
        };
        // this.mind = new AgentMind(this);
    }

    moveTo(target: Position) {
        this.targetPosition = target;
        this.data.status = 'Moving';
    }

    stop() {
        this.targetPosition = null;
        this.data.status = 'Idle';
    }

    tick() {
        if (this.targetPosition) {
            const dx = this.targetPosition.x - this.data.position.x;
            const dy = this.targetPosition.y - this.data.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.data.position = { ...this.targetPosition };
                this.targetPosition = null;
                this.data.status = 'Idle';
            } else {
                const ratio = this.speed / distance;
                this.data.position.x += dx * ratio;
                this.data.position.y += dy * ratio;
            }
        }
    }
}
