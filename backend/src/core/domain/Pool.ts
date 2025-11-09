export interface PoolMember {
  shipId: string;
  adjustedCB: number;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  poolId: string;
  year: number;
  members: PoolMember[];
  poolSum: number; // Sum of adjusted CBs
  createdAt: Date;
}

export interface CreatePoolRequest {
  year: number;
  memberShipIds: string[];
}

