export type Status = 'poison' | 'burn' | 'chill' | 'paralysis' | 'silence' | 'weaken' | 'armorBreak';
export type StatusValue = { stacks: number; turns: number };
export type Statuses = Partial<Record<Status, StatusValue>>;

export const STATUS_RULES: Record<Status, { max: number; turns: number; description: string }> = {
    poison: { max: 5, turns: 2, description: 'Lose 2 health per stack after the enemy response.' },
    burn: { max: 5, turns: 2, description: 'Lose 3 health per stack after the enemy response.' },
    chill: { max: 2, turns: 2, description: 'Attacks deal 4 less per stack.' },
    paralysis: { max: 1, turns: 1, description: 'Combo capacity is reduced by 1 next turn.' },
    silence: { max: 1, turns: 1, description: 'Elemental cards cannot be queued next turn.' },
    weaken: { max: 2, turns: 2, description: 'Attacks deal 3 less per stack.' },
    armorBreak: { max: 2, turns: 2, description: 'Incoming hits deal 3 more per stack.' },
};

export function applyStatus(statuses: Statuses, status: Status, stacks = 1): void {
    const rule = STATUS_RULES[status];
    const current = statuses[status];
    statuses[status] = { stacks: Math.min(rule.max, (current?.stacks ?? 0) + stacks), turns: rule.turns };
}

export function stacks(statuses: Statuses, status: Status): number {
    return statuses[status]?.stacks ?? 0;
}

export function tickStatuses(statuses: Statuses): number {
    const damage = stacks(statuses,'poison')*2 + stacks(statuses,'burn')*3;
    for (const status of Object.keys(statuses) as Status[]) {
        const value = statuses[status];
        if (value && --value.turns <= 0) delete statuses[status];
    }
    return damage;
}
