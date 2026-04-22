export type Attribute = 'AGI' | 'FOR' | 'INT' | 'VIG' | 'PRE';

export interface Attributes {
  AGI: number; FOR: number; INT: number; VIG: number; PRE: number;
}

export type ClassType = 'Combatente' | 'Especialista' | 'Ocultista';

export interface Ability {
  id: string;
  name: string;
  description: string;
  cost?: number;
  source: string;
  showInCombat?: boolean;
  actionFormula?: string;
}

export interface Modification {
  id: string;
  name: string;
  categoryCost: number;
  description: string;
  type: 'Arma' | 'Armadura' | 'Acessório';
}

export interface Curse {
  id: string;
  name: string;
  categoryCost: number;
  description: string;
  element: 'Sangue' | 'Morte' | 'Energia' | 'Conhecimento' | 'Medo';
  type: 'Arma' | 'Armadura' | 'Acessório';
}

export interface Item {
  id: string;
  name: string;
  space: number;
  baseCategory: number;
  category: number;
  description: string;
  tipo?: 'Arma' | 'Proteção' | 'Item Geral';
  isWeapon?: boolean;
  isArmor?: boolean;
  damage?: string;
  defenseBonus?: number;
  equipped?: boolean;
  skillUsed?: string;
  critRange?: number;
  critMultiplier?: number;
  modifications?: string[];
  curses?: string[];
}

export interface Ritual {
  id: string;
  name: string;
  description: string;
  damage?: string;
  cost?: number;
  discenteDamage?: string;
  discenteExtraCost?: number;
  trueDamage?: string;
  trueExtraCost?: number;
  source: string;
  circle: number;
  element: string;
  execution: string;
  range: string;
  target: string;
  duration: string;
}

export interface Threat {
  id: string;
  name: string;
  attributes: Attributes;
  skills: Record<string, number>;
  currentHp: number;
  maxHp: number;
  currentPd: number;
  maxPd: number;
  abilities: Ability[];
  inventory: Item[];
  rituals: Ritual[];
  isThreat: boolean;
}

export type UserRole = 'mestre' | 'jogador';

// Agora o PlayerData é a Ficha Completa!
export interface Character {
  id: string;
  playerName?: string;
  characterName?: string;
  name?: string;
  class: ClassType;
  trackPath: string;
  origin: string;
  rank: string;
  level: number;
  attributes: Attributes;
  currentHp: number; maxHp: number;
  currentPd: number; maxPd: number; 
  skills: Record<string, number>;
  skillBonuses: Record<string, number>;
  abilities: Ability[];
  rituals: Ritual[];
  inventory: Item[];
  customModifications?: Modification[];
  customCurses?: Curse[];
  createdAt: number;
}

export interface Campaign {
  id: string;
  name: string;
  players: Character[]; // O mestre recebe os Characters inteiros
  threats: Threat[];
}