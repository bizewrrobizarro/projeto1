/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { 
  Plus, Trash2, User, Shield, Search, Zap, Brain, Heart, Sword, 
  Backpack, BookOpen, X, ChevronRight, ChevronDown, Users, Eye, 
  EyeOff, Skull, Share2, Copy, LayoutDashboard, Dices, UserPlus, LogOut,
  Edit3, RefreshCw
} from 'lucide-react';
import { Character, ClassType, Attribute, Attributes, Item, Ritual, Ability, Modification, Curse, Campaign, Threat, UserRole } from './types';
import { SYSTEM_DATA, SKILLS_LIST } from './constants';

// --- Substitutos do Prompt/Alert para o Electron ---

const askCustom = (message: string, defaultValue = ''): Promise<string | null> => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm";
    
    const box = document.createElement('div');
    box.className = "bg-void border border-blood p-6 rounded-xl flex flex-col gap-4 w-80 shadow-[0_0_20px_rgba(178,34,34,0.3)]";
    
    const label = document.createElement('label');
    label.className = "text-white font-bold text-sm uppercase tracking-widest text-center";
    label.innerText = message;
    
    const input = document.createElement('textarea');
    input.className = "bg-black border border-gray-800 rounded p-3 text-white outline-none focus:border-blood text-sm min-h-[80px] resize-y";
    input.value = defaultValue;
    
    const btnBox = document.createElement('div');
    btnBox.className = "flex justify-between gap-2 mt-4";
    
    const btnCancel = document.createElement('button');
    btnCancel.className = "flex-1 py-2 text-gray-500 hover:text-white border border-gray-800 rounded text-xs uppercase font-bold transition-all";
    btnCancel.innerText = "Cancelar";
    
    const btnOk = document.createElement('button');
    btnOk.className = "flex-1 py-2 bg-blood hover:bg-blood-dark text-white rounded text-xs uppercase font-bold transition-all";
    btnOk.innerText = "Confirmar";
    
    btnCancel.onclick = () => { document.body.removeChild(overlay); resolve(null); };
    btnOk.onclick = () => { document.body.removeChild(overlay); resolve(input.value); };
    
    btnBox.appendChild(btnCancel);
    btnBox.appendChild(btnOk);
    box.appendChild(label);
    box.appendChild(input);
    box.appendChild(btnBox);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    input.focus();
    input.select();
  });
};

const confirmCustom = (message: string, textOk = "Sim", textCancel = "Cancelar"): Promise<boolean> => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm";
    
    const box = document.createElement('div');
    box.className = "bg-void border border-blood p-6 rounded-xl flex flex-col gap-4 w-80 shadow-[0_0_20px_rgba(178,34,34,0.3)] text-center";
    
    const label = document.createElement('label');
    label.className = "text-white font-bold text-sm uppercase tracking-widest";
    label.innerText = message;
    
    const btnBox = document.createElement('div');
    btnBox.className = "flex justify-between gap-2 mt-4";
    
    const btnCancel = document.createElement('button');
    btnCancel.className = "flex-1 py-2 text-gray-500 hover:text-white border border-gray-800 rounded text-xs uppercase font-bold transition-all";
    btnCancel.innerText = textCancel;
    
    const btnOk = document.createElement('button');
    btnOk.className = "flex-1 py-2 bg-blood hover:bg-blood-dark text-white rounded text-xs uppercase font-bold transition-all";
    btnOk.innerText = textOk;
    
    btnCancel.onclick = () => { document.body.removeChild(overlay); resolve(false); };
    btnOk.onclick = () => { document.body.removeChild(overlay); resolve(true); };
    
    btnBox.appendChild(btnCancel);
    btnBox.appendChild(btnOk);
    box.appendChild(label);
    box.appendChild(btnBox);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  });
};

const alertCustom = (message: string): Promise<void> => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm";
    const box = document.createElement('div');
    box.className = "bg-void border border-blood p-6 rounded-xl flex flex-col gap-4 w-80 shadow-[0_0_20px_rgba(178,34,34,0.3)] text-center";
    const label = document.createElement('label');
    label.className = "text-white font-bold text-sm uppercase tracking-widest";
    label.innerText = message;
    const btnOk = document.createElement('button');
    btnOk.className = "w-full py-2 bg-blood hover:bg-blood-dark text-white rounded text-xs uppercase font-bold transition-all mt-2";
    btnOk.innerText = "OK";
    btnOk.onclick = () => { document.body.removeChild(overlay); resolve(); };
    box.appendChild(label);
    box.appendChild(btnOk);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  });
};

// --- Helpers ---

const rollDice = (diceStr: string) => {
  const match = diceStr.toLowerCase().match(/(\d*)d(\d+)/);
  if (!match) return { total: 0, rolls: [] };
  const count = parseInt(match[1] || '1');
  const sides = parseInt(match[2]);
  let rolls: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    rolls.push(r);
    total += r;
  }
  return { total, rolls };
};

const calculateMaxHp = (charClass: ClassType, vig: number, level: number) => {
  const data = SYSTEM_DATA.classes[charClass];
  return data.baseHp + vig + (level - 1) * (data.hpPerLevel + vig);
};

const calculateMaxPd = (charClass: ClassType, pre: number, level: number) => {
  if (charClass === 'Combatente') return 6 + pre + (level - 1) * (3 + pre);
  if (charClass === 'Especialista') return 8 + pre + (level - 1) * (4 + pre);
  if (charClass === 'Ocultista') return 10 + pre + (level - 1) * (5 + pre);
  return 4 + pre + (level - 1) * 2; 
};

// Conexão forçada para a porta 3000
const socket: Socket = io('http://localhost:3000');

// --- Components ---

interface AttributeHexProps {
  label: Attribute;
  value: number;
  onChange?: (val: number) => void;
  key?: string | number;
}

const AttributeHex = ({ label, value, onChange }: AttributeHexProps) => (
  <div className="attribute-hexagon group relative">
    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{label}</span>
    {onChange ? (
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full bg-transparent text-center text-xl font-bold text-white outline-none"
      />
    ) : (
      <span className="text-xl font-bold text-white">{value}</span>
    )}
  </div>
);

interface ProgressBarProps {
  label: string; 
  current: number; 
  max: number; 
  colorClass: string; 
  icon: any;
  onUpdate?: (newVal: number) => void;
  onUpdateMax?: (newVal: number) => void;
  readOnly?: boolean;
}

const ProgressBar = ({ label, current, max, colorClass, icon: Icon, onUpdate, onUpdateMax, readOnly = false }: ProgressBarProps) => {
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const overflow = max > 0 ? Math.max(0, ((current - max) / max) * 100) : 0;
  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <Icon size={12} className={colorClass.replace('bg-', 'text-')} />
          <span className="text-[10px] text-gray-500 uppercase font-bold">{label}</span>
        </div>
        <div className="flex items-center gap-1 group">
           {!readOnly && <button onClick={() => onUpdate?.(current - 1)} className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-white">-</button>}
           <div className="flex items-center text-xs font-mono text-white">
             {readOnly ? (
               <span>{current} / {max}</span>
             ) : (
               <>
                 <input 
                   type="number" 
                   value={current} 
                   onChange={(e) => onUpdate?.(parseInt(e.target.value) || 0)}
                   className="w-8 bg-transparent text-right outline-none"
                 />
                 <span className="mx-0.5">/</span>
                 <input 
                   type="number" 
                   value={max} 
                   onChange={(e) => onUpdateMax?.(parseInt(e.target.value) || 0)}
                   className="w-8 bg-transparent text-left outline-none text-gray-500"
                 />
               </>
             )}
           </div>
           {!readOnly && <button onClick={() => onUpdate?.(current + 1)} className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-white">+</button>}
        </div>
      </div>
      <div className="h-2 bg-gray-900 rounded-full overflow-hidden blood-border relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percentage)}%` }}
          className={`h-full ${colorClass}`}
        />
        {percentage >= 100 && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overflow}%` }}
            className={`h-full absolute top-0 left-0 bg-white/30`}
          />
        )}
      </div>
    </div>
  );
};


// --- THREAT SHEET COMPONENT ---
interface ThreatSheetProps {
  threat: Threat;
  onUpdate: (threat: Threat) => void;
  onClose: () => void;
  logRoll: (label: string, diceResult: {total: number, rolls: number[]}, bonus?: number) => void;
}

const ThreatSheet = ({ threat, onUpdate, onClose, logRoll }: ThreatSheetProps) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-void blood-border w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col"
      >
        <div className="p-6 border-b border-blood-dark flex justify-between items-center bg-black/40 sticky top-0 z-10 backdrop-blur-md">
           <div className="flex items-center gap-4">
              <Skull className="text-blood" size={32} />
              <div>
                <input 
                  type="text" 
                  value={threat.name}
                  onChange={(e) => onUpdate({ ...threat, name: e.target.value })}
                  className="bg-transparent text-2xl font-serif text-white outline-none border-b border-transparent focus:border-blood w-full"
                />
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Ficha de Ameaça / Criatura</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-500 hover:text-white transition-all">
              <X size={24} />
           </button>
        </div>

        <div className="p-6 grid grid-cols-12 gap-6">
           <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="grid grid-cols-3 gap-2 justify-items-center">
                 {(['AGI', 'FOR', 'INT', 'VIG', 'PRE'] as Attribute[]).map(attr => (
                   <AttributeHex 
                      key={attr}
                      label={attr} 
                      value={threat.attributes[attr]} 
                      onChange={(val) => onUpdate({ ...threat, attributes: { ...threat.attributes, [attr]: val } })}
                   />
                 ))}
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-gray-900 space-y-4">
                 <ProgressBar 
                   label="Pontos de Vida" current={threat.currentHp} max={threat.maxHp} colorClass="bg-red-600" icon={Heart}
                   onUpdate={(val) => onUpdate({ ...threat, currentHp: val })}
                   onUpdateMax={(val) => onUpdate({ ...threat, maxHp: val })}
                 />
                 <ProgressBar 
                   label="Pontos de Determinação" current={threat.currentPd} max={threat.maxPd} colorClass="bg-blue-600" icon={Brain}
                   onUpdate={(val) => onUpdate({ ...threat, currentPd: val })}
                   onUpdateMax={(val) => onUpdate({ ...threat, maxPd: val })}
                 />
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-gray-900">
                <h4 className="text-[10px] text-gray-500 uppercase font-bold mb-4 flex items-center gap-2">
                   <Sword size={12} /> Perícias Relevantes
                </h4>
                <div className="space-y-2">
                   {SKILLS_LIST.map(skill => {
                      const value = threat.skills[skill] || 0;
                      if (value === 0) return null; // Só mostra perícias que a ameaça tem
                      return (
                        <div key={skill} className="flex justify-between items-center group bg-black/20 p-2 rounded">
                           <span className="text-xs text-gray-300">{skill}</span>
                           <div className="flex gap-2 items-center">
                              <span className="font-mono text-blood font-bold text-xs">+{value}</span>
                              <button onClick={() => onUpdate({ ...threat, skills: { ...threat.skills, [skill]: 0 } })} className="text-gray-800 hover:text-red-500"><X size={12}/></button>
                           </div>
                        </div>
                      );
                   })}
                   <button 
                      onClick={async () => {
                        const skillName = await askCustom("Nome da Perícia:");
                        if (skillName) {
                          const valStr = await askCustom(`Bônus em ${skillName} (Ex: 10):`, "5");
                          onUpdate({ ...threat, skills: { ...threat.skills, [skillName]: parseInt(valStr||'0') } });
                        }
                      }}
                      className="w-full py-1.5 mt-2 border border-dashed border-gray-800 rounded text-[9px] uppercase font-bold text-gray-600 hover:text-white"
                   >
                     + Adicionar Perícia
                   </button>
                </div>
              </div>
           </div>

           <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Ataques */}
              <div className="bg-black/40 p-5 rounded-xl border border-gray-900">
                 <h3 className="text-xs font-bold text-blood border-b border-blood-dark pb-2 mb-4 uppercase tracking-widest flex justify-between">
                   Ataques
                   <button onClick={async () => {
                        const name = await askCustom("Nome do Ataque:");
                        if (name) {
                          const damage = await askCustom("Dano (Ex: 2d10+5):", "1d6");
                          const bonusStr = await askCustom("Bônus de Acerto (Ex: 15):", "0");
                          onUpdate({ ...threat, inventory: [...threat.inventory, { id: Math.random().toString(), name, damage: damage || "1d6", defenseBonus: parseInt(bonusStr||'0'), isWeapon: true, space: 0, baseCategory: 0, category: 0, description: "" }] });
                        }
                      }} className="text-[9px] text-gray-500 hover:text-white">+ Adicionar</button>
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {threat.inventory.map(atk => (
                      <div key={atk.id} className="bg-black/60 border border-gray-800 p-3 rounded-lg group">
                         <div className="flex justify-between items-start mb-2">
                           <h4 className="text-white font-bold text-sm">{atk.name}</h4>
                           <button onClick={() => onUpdate({ ...threat, inventory: threat.inventory.filter(i => i.id !== atk.id) })} className="text-gray-800 hover:text-blood"><Trash2 size={12}/></button>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={() => {
                               const res = rollDice('1d20');
                               logRoll(`Ataque: ${atk.name}`, res, atk.defenseBonus || 0); // Usando defenseBonus improvisado como Bonus de Acerto pra Ameaça
                             }} className="flex-1 bg-gray-900 py-1 rounded text-[10px] font-bold text-gray-400 hover:bg-blood hover:text-white transition-all">
                             Acerto: +{atk.defenseBonus || 0}
                           </button>
                           <button onClick={() => {
                               logRoll(`Dano: ${atk.name}`, rollDice(atk.damage || '1d4'));
                             }} className="flex-1 bg-blood/20 border border-blood/50 py-1 rounded text-[10px] font-bold text-blood hover:bg-blood hover:text-white transition-all">
                             Dano: {atk.damage}
                           </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Habilidades */}
              <div className="bg-black/40 p-5 rounded-xl border border-gray-900">
                 <h3 className="text-xs font-bold text-blood border-b border-blood-dark pb-2 mb-4 uppercase tracking-widest flex justify-between">
                   Habilidades e Passivas
                   <button onClick={async () => {
                        const name = await askCustom("Nome da Habilidade:");
                        if (name) {
                          const desc = await askCustom("Descrição:");
                          onUpdate({ ...threat, abilities: [...threat.abilities, { id: Math.random().toString(), name, description: desc || "", source: "Ameaça" }] });
                        }
                      }} className="text-[9px] text-gray-500 hover:text-white">+ Adicionar</button>
                 </h3>
                 <div className="space-y-3">
                    {threat.abilities.map(ab => (
                      <div key={ab.id} className="relative group bg-black/20 p-3 rounded border border-gray-800">
                         <h4 className="text-white font-bold text-sm">{ab.name}</h4>
                         <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{ab.description}</p>
                         <button onClick={() => onUpdate({ ...threat, abilities: threat.abilities.filter(a => a.id !== ab.id) })} className="absolute top-2 right-2 text-gray-800 hover:text-blood opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                      </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>
      </motion.div>
    </div>
  );
};


// --- VIEW PLAYER SHEET MODAL (DM SCREEN) ---
const ViewPlayerSheet = ({ character, onClose }: { character: Character, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-void blood-border w-full max-w-6xl h-[90vh] overflow-hidden rounded-2xl flex flex-col"
      >
        <div className="p-6 border-b border-blood-dark flex justify-between items-center bg-black/40">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-blood text-xl font-serif">
                {(character.characterName || 'A')[0]}
              </div>
              <div>
                <h2 className="text-2xl font-serif text-white uppercase">{character.characterName}</h2>
                <p className="text-[10px] text-blood font-bold tracking-widest uppercase">{character.class} • {character.trackPath} • NEX {character.level * 5}%</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-500 hover:text-white">
              <X size={24} />
           </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="space-y-6">
              <div className="bg-black/40 p-4 rounded-xl border border-gray-900 space-y-4">
                 <ProgressBar label="Pontos de Vida" current={character.currentHp} max={character.maxHp} colorClass="bg-red-600" icon={Heart} readOnly />
                 <ProgressBar label="Pontos de Determinação" current={character.currentPd} max={character.maxPd} colorClass="bg-blue-600" icon={Brain} readOnly />
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-gray-900 grid grid-cols-3 gap-2 justify-items-center">
                 {(['AGI', 'FOR', 'INT', 'VIG', 'PRE'] as Attribute[]).map(attr => (
                   <div key={attr} className="text-center">
                     <span className="text-[10px] text-gray-500 uppercase font-bold block">{attr}</span>
                     <span className="text-xl text-white font-bold">{character.attributes[attr]}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-2 space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="bg-black/40 p-4 rounded-xl border border-gray-900">
                  <h3 className="text-xs font-bold text-blood border-b border-blood-dark pb-2 mb-4 uppercase tracking-widest">Armas e Inventário</h3>
                  <div className="space-y-2">
                    {character.inventory.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-black/60 p-2 rounded border border-gray-800">
                        <div>
                          <span className={`text-xs font-bold ${item.equipped ? 'text-white' : 'text-gray-500'}`}>{item.name}</span>
                          {item.isWeapon && <p className="text-[9px] text-gray-500">Dano: {item.damage} (Crit {item.critRange}/x{item.critMultiplier})</p>}
                        </div>
                        <span className="text-[10px] font-mono text-gray-600">{item.space} P</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-xl border border-gray-900">
                  <h3 className="text-xs font-bold text-blood border-b border-blood-dark pb-2 mb-4 uppercase tracking-widest">Habilidades</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {character.abilities.map(ab => (
                      <div key={ab.id} className="bg-black/60 p-2 rounded border border-gray-800">
                        <div className="flex justify-between">
                          <span className="text-xs font-bold text-white">{ab.name}</span>
                          {ab.cost && <span className="text-[9px] text-blue-500">{ab.cost} PD</span>}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{ab.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};


// --- Main App ---

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-abyss flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-serif text-blood mb-4">CRITICAL SYSTEM FAILURE</h1>
          <p className="text-gray-400 mb-8 max-w-md">Ocorreu um erro catastrófico na ficha. Seus dados podem estar corrompidos.</p>
          <pre className="bg-black p-4 rounded text-xs text-red-500 mb-8 overflow-auto max-w-xl text-left">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => {
              localStorage.removeItem('op_characters');
              window.location.reload();
            }}
            className="bg-blood text-white px-8 py-2 rounded-full font-bold uppercase tracking-widest"
          >
            Resetar Todos os Dados
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'pericias' | 'combate' | 'habilidades' | 'rituais' | 'inventario'>('pericias');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'classe' | 'trilha' | 'poderes_gerais' | 'poderes_paranormais'>('classe');
  const [rolls, setRolls] = useState<{id: string, label: string, total: number, detail: string, timestamp: number}[]>([]);
  const [mainView, setMainView] = useState<'library' | 'campaigns'>('library');
  const [quickDice, setQuickDice] = useState('');

  // Campaign State
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('jogador');
  const [campaignInput, setCampaignInput] = useState('');
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Character | null>(null);

  const logRoll = (label: string, diceResult: {total: number, rolls: number[]}, bonus: number = 0) => {
    const newRoll = {
      id: Math.random().toString(36).substr(2, 9),
      label,
      total: diceResult.total + bonus,
      detail: `[${diceResult.rolls.join(', ')}]${bonus >= 0 ? ' + ' + bonus : ' - ' + Math.abs(bonus)}`,
      timestamp: Date.now()
    };
    setRolls(prev => [newRoll, ...prev].slice(0, 5));
  };

  const [newChar, setNewChar] = useState<Partial<Character> & { customOriginData?: any }>({
    playerName: '',
    characterName: '',
    class: 'Combatente',
    trackPath: '',
    origin: SYSTEM_DATA.origins[0].name,
    rank: 'Recruta',
    level: 1,
    attributes: { AGI: 1, FOR: 1, INT: 1, VIG: 1, PRE: 1 },
    skills: {},
    skillBonuses: {},
    inventory: [],
    abilities: [],
    rituals: []
  });

  const selectedChar = useMemo(() => {
    const found = characters.find(c => c.id === selectedId);
    if (!found) return undefined;
    
    return {
      ...found,
      skills: found.skills || {},
      skillBonuses: found.skillBonuses || {},
      abilities: found.abilities || [],
      rituals: found.rituals || [],
      inventory: found.inventory || [],
      customModifications: found.customModifications || [],
      customCurses: found.customCurses || [],
      trackPath: found.trackPath || '',
      origin: found.origin || SYSTEM_DATA.origins[0].name,
      attributes: {
        AGI: found.attributes?.AGI || 0,
        FOR: found.attributes?.FOR || 0,
        INT: found.attributes?.INT || 0,
        VIG: found.attributes?.VIG || 0,
        PRE: found.attributes?.PRE || 0
      },
      maxPd: found.maxPd || calculateMaxPd(found.class, found.attributes?.PRE || 1, found.level || 1),
      currentPd: found.currentPd !== undefined ? found.currentPd : calculateMaxPd(found.class, found.attributes?.PRE || 1, found.level || 1)
    } as Character;
  }, [characters, selectedId]);

  const defense = useMemo(() => {
    if (!selectedChar) return 10;
    const inv = selectedChar.inventory || [];
    const armors = inv.filter(i => i && i.isArmor && i.equipped);
    const armorBonus = armors.reduce((acc, i) => {
      let base = i.defenseBonus || 0;
      (i.modifications || []).forEach(mid => {
        if (mid === 'm4') base += 2; // Reforçada
      });
      return acc + base;
    }, 0);
    
    return 10 + (selectedChar.attributes?.AGI || 0) + armorBonus;
  }, [selectedChar]);

  useEffect(() => {
    socket.on('campaign:created', (newCampaign: Campaign) => {
      setCampaign(newCampaign);
      setUserRole('mestre');
    });

    socket.on('campaign:joined', (joinedCampaign: Campaign) => {
      setCampaign(joinedCampaign);
      setUserRole('jogador');
    });

    socket.on('campaign:updated', (updatedCampaign: Campaign) => {
      setCampaign(updatedCampaign);
    });

    socket.on('campaign:error', (error: string) => {
      alertCustom(error);
    });

    return () => {
      socket.off('campaign:created');
      socket.off('campaign:joined');
      socket.off('campaign:updated');
      socket.off('campaign:error');
    };
  }, []);

  const createCampaign = async () => {
    const name = await askCustom("Nome da Campanha:");
    if (name) socket.emit('campaign:create', { name });
  };

  const joinCampaign = () => {
    if (campaignInput) socket.emit('campaign:join', campaignInput.toUpperCase());
  };

  const syncCharacter = (char: Character) => {
    if (campaign) {
      socket.emit('character:sync', { campaignId: campaign.id, character: char });
    }
  };

  const syncThreat = (threat: Threat) => {
    if (campaign && userRole === 'mestre') {
      socket.emit('threat:sync', { campaignId: campaign.id, threat });
    }
  };

  const deleteThreat = (threatId: string) => {
    if (campaign && userRole === 'mestre') {
      socket.emit('threat:delete', { campaignId: campaign.id, threatId });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('op_characters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(c => c && typeof c === 'object').map(c => ({
            ...c,
            characterName: c.characterName || 'Agente Sem Nome',
            class: c.class || 'Combatente',
            level: c.level || 1,
            maxHp: c.maxHp || 20,
            currentHp: c.currentHp || 0,
            trackPath: c.trackPath || '',
            inventory: c.inventory || []
          }));
          setCharacters(valid);
        }
      } catch (e) {
        console.error("Failed to load characters", e);
      }
    }
  }, []);

  const saveToLocal = (chars: Character[]) => {
    localStorage.setItem('op_characters', JSON.stringify(chars));
    setCharacters(chars);
  };

  const createCharacter = () => {
    if (!newChar.characterName || !newChar.playerName) return;

    const charClass = newChar.class as ClassType;
    const vig = newChar.attributes!.VIG;
    const pre = newChar.attributes!.PRE;
    const level = newChar.level || 1;
    
    const maxHp = calculateMaxHp(charClass, vig, level);
    const maxPd = calculateMaxPd(charClass, pre, level);

    let baseAbilities: Ability[] = [
      ...SYSTEM_DATA.classes[charClass].initialAbilities.map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        description: `Habilidade básica de ${charClass}`,
        source: 'Classe'
      }))
    ];
    
    let skillsObj: Record<string, number> = {};

    // Injeta a Origem Customizada
    if (newChar.customOriginData) {
       baseAbilities.push(newChar.customOriginData.ability);
       newChar.customOriginData.skills.forEach((s: string) => {
          if(s) skillsObj[s] = 5; // Dá +5 nas perícias da origem customizada
       });
    }

    const character: Character = {
      ...newChar as Character,
      id: Math.random().toString(36).substr(2, 9),
      currentHp: maxHp,
      maxHp,
      currentPd: maxPd,
      maxPd: maxPd,
      skills: skillsObj,
      skillBonuses: {},
      abilities: baseAbilities,
      inventory: [],
      rituals: [],
      createdAt: Date.now()
    };
    
    delete (character as any).customOriginData; // Limpa o temporário

    const updated = [...characters, character];
    saveToLocal(updated);
    setIsCreating(false);
    setSelectedId(character.id);
  };

  const updateCharacter = (updates: Partial<Character>) => {
    if (!selectedId) return;
    const updated = characters.map(c => c.id === selectedId ? { ...c, ...updates } : c);
    saveToLocal(updated);
    
    const char = updated.find(c => c.id === selectedId);
    if (char && campaign) {
      syncCharacter(char);
    }
  };

  const deleteCharacter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirmCustom("Tem certeza que deseja apagar esta ficha?", "Apagar", "Cancelar");
    if (confirmed) {
      const updated = characters.filter(c => c.id !== id);
      saveToLocal(updated);
      if (selectedId === id) setSelectedId(null);
    }
  };

  const spendPd = async (amount: number) => {
    if (!selectedChar) return false;
    if (selectedChar.currentPd < amount) {
      await alertCustom("PD Insuficiente!");
      return false;
    }
    updateCharacter({ currentPd: selectedChar.currentPd - amount });
    return true;
  };

  const rollSpecialAttack = async () => {
    const amount = await askCustom("Quantos PD deseja gastar no Ataque Especial? (1 a 20)", "1");
    if (amount === null) return;
    const pd = parseInt(amount || '0');
    if (isNaN(pd) || pd <= 0) return;
    
    if (await spendPd(pd)) {
      const isAttack = await confirmCustom("Onde deseja aplicar o Bônus?", "Teste de Ataque", "Dano Final");
      await alertCustom(`Você gastou ${pd} PD. Bônus aplicado: +${pd * 5} no ${isAttack ? 'Ataque' : 'Dano'}.`);
    }
  };

  const rollQuickDice = () => {
    if (!quickDice) return;
    const result = rollDice(quickDice);
    if (result.total > 0) {
      logRoll(`Roll Avulso (${quickDice})`, result);
      setQuickDice('');
    }
  };

  return (
    <div className="min-h-screen bg-abyss text-[#d1d1d1] flex flex-col p-4 md:p-8">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>

      {campaign && selectedThreatId && (
        <ThreatSheet 
          threat={campaign.threats.find(t => t.id === selectedThreatId)!} 
          onUpdate={syncThreat}
          onClose={() => setSelectedThreatId(null)}
          logRoll={logRoll}
        />
      )}

      {viewingPlayer && (
        <ViewPlayerSheet character={viewingPlayer} onClose={() => setViewingPlayer(null)} />
      )}

      {/* Floating Quick Roller */}
      <div className="fixed bottom-8 right-8 z-40 bg-black/60 backdrop-blur-md p-4 rounded-2xl blood-border shadow-2xl flex flex-col gap-2 w-48 transition-all hover:bg-black/80">
        <div className="flex items-center gap-2 mb-1">
          <Dices size={16} className="text-blood" />
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Rolagem Rápida</span>
        </div>
        <input 
          type="text" 
          placeholder="Ex: 3d20+5"
          value={quickDice}
          onChange={(e) => setQuickDice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && rollQuickDice()}
          className="bg-void border border-gray-800 rounded p-2 text-xs text-white placeholder:text-gray-700 outline-none focus:border-blood transition-all"
        />
        <p className="text-[8px] text-gray-600 text-center uppercase font-medium">Pressione Enter para rolar</p>
      </div>

      {!selectedId && !isCreating ? (
        <div className="max-w-6xl mx-auto w-full">
          <header className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-8 border-b border-gray-900 pb-8">
            <div>
              <h1 className="text-4xl font-serif text-white tracking-widest mb-2 uppercase">Ordem Paranormal</h1>
              <div className="flex gap-6 mt-4">
                 <button 
                  onClick={() => setMainView('library')}
                  className={`text-[10px] uppercase font-bold tracking-[0.2em] pb-1 border-b-2 transition-all ${mainView === 'library' ? 'text-blood border-blood' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                 >
                   Biblioteca
                 </button>
                 <button 
                  onClick={() => setMainView('campaigns')}
                  className={`text-[10px] uppercase font-bold tracking-[0.2em] pb-1 border-b-2 transition-all ${mainView === 'campaigns' ? 'text-blood border-blood' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                 >
                   Campanhas
                 </button>
              </div>
            </div>
            
            {mainView === 'library' && (
              <button 
                onClick={() => setIsCreating(true)}
                className="group relative px-8 py-3 bg-blood text-white font-bold uppercase tracking-widest text-xs transition-all hover:bg-black hover:text-blood border border-blood overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <UserPlus size={16} /> Novo Agente
                </span>
                <div className="absolute top-0 left-[-100%] w-full h-full bg-white opacity-10 skew-x-[-20deg] group-hover:left-[100%] transition-all duration-500"></div>
              </button>
            )}
          </header>

          {mainView === 'library' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreating(true)}
              className="h-64 blood-border rounded-xl bg-void flex flex-col items-center justify-center gap-4 group hover:bg-blood-dark/20 transition-all cursor-pointer"
            >
              <div className="p-4 bg-void border border-gray-800 rounded-full group-hover:border-blood transition-colors">
                <Plus size={32} className="text-blood group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-400 group-hover:text-white">Criar Novo Agente</span>
            </motion.button>

            {characters.map((char) => (
              <motion.div
                key={char.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedId(char.id)}
                className="h-64 blood-border rounded-xl bg-void p-6 relative group cursor-pointer hover:blood-glow transition-all flex flex-col"
              >
                <button 
                  onClick={(e) => deleteCharacter(char.id, e)}
                  className="absolute top-4 right-4 text-gray-600 hover:text-blood opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
                <div className="mb-4 flex-1">
                  <div className="w-16 h-16 bg-gray-800 rounded-full blood-border mb-4 flex items-center justify-center text-blood text-2xl font-serif">
                    {(char.characterName || 'A')[0]}
                  </div>
                  <h3 className="text-xl font-serif text-white tracking-wide truncate">{char.characterName}</h3>
                  <p className="text-[10px] text-blood font-bold tracking-widest uppercase mt-1">{char.class} • {char.trackPath} • NEX {char.level * 5}%</p>
                </div>
                <div className="space-y-3 mt-auto">
                  <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600" style={{ width: `${Math.max(0, Math.min(100, (char.currentHp / (char.maxHp || 1)) * 100))}%` }}></div>
                  </div>
                  <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, (char.currentPd / (char.maxPd || 1)) * 100))}%` }}></div>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-void blood-border rounded-2xl overflow-hidden p-8">
              {!campaign ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="text-gray-800 mb-4" size={64} />
                  <h3 className="text-2xl font-serif text-white mb-2">Multiplayer & Campanhas</h3>
                  <p className="text-gray-500 text-sm max-w-md mb-8">Conecte-se com seu mestre ou crie sua própria mesa para sincronizar fichas e combates em tempo real.</p>
                  
                  <div className="flex flex-col gap-4 w-full max-w-sm">
                    <button onClick={createCampaign} className="bg-blood text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(178,34,34,0.2)]">
                      <Shield size={20} /> Hospedar Nova Mesa
                    </button>
                    <div className="relative mt-4">
                      <div className="text-[10px] text-gray-600 uppercase font-bold mb-2 tracking-[0.2em]">Entrar como Jogador</div>
                      <input 
                        type="text" 
                        placeholder="CÓDIGO DA MESA"
                        value={campaignInput}
                        onChange={(e) => setCampaignInput(e.target.value.toUpperCase())}
                        className="w-full bg-black/60 border border-gray-800 p-4 rounded-xl text-white font-mono text-center text-xl tracking-[0.5em] outline-none focus:border-blood transition-all placeholder:text-gray-800"
                      />
                      <button onClick={joinCampaign} className="w-full mt-3 bg-gray-900 border border-gray-800 text-gray-500 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:text-white hover:bg-black transition-all">
                        Entrar na Campanha
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center bg-black/40 p-6 rounded-2xl border border-gray-900 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blood/10 rounded-full flex items-center justify-center border border-blood/20">
                        <Users className="text-blood" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Sessão Ativa</p>
                        <h3 className="text-2xl font-serif text-white">{campaign.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Código da Mesa</p>
                        <span className="text-2xl font-mono text-blood font-bold tracking-widest px-4 py-1 bg-black rounded-lg border border-gray-800">{campaign.id}</span>
                      </div>
                      <button onClick={() => { setCampaign(null); setUserRole('jogador'); }} className="text-gray-600 hover:text-white transition-all">
                        <LogOut size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                    {/* VISÃO DO JOGADOR - ENVIAR FICHA */}
                    {userRole === 'jogador' && (
                      <div className="bg-black/20 border border-gray-900 p-6 rounded-2xl mb-4">
                        <h4 className="text-xs font-bold text-blood mb-4 uppercase tracking-widest flex items-center gap-2">
                           <UserPlus size={14} /> Integrar Personagem
                        </h4>
                        <div className="flex gap-4 items-center">
                           <select 
                             className="flex-1 bg-black border border-gray-800 rounded p-3 text-white outline-none focus:border-blood text-sm"
                             onChange={(e) => {
                               const c = characters.find(char => char.id === e.target.value);
                               if(c) syncCharacter(c);
                             }}
                           >
                             <option value="">-- Selecione uma Ficha da Biblioteca --</option>
                             {characters.map(c => <option key={c.id} value={c.id}>{c.characterName} (NEX {c.level * 5}%)</option>)}
                           </select>
                           <button className="bg-gray-900 border border-gray-800 p-3 rounded hover:text-white text-gray-500" title="Sincronizar novamente">
                             <RefreshCw size={20} />
                           </button>
                        </div>
                        <p className="text-[10px] text-gray-600 italic mt-3">Sua ficha será enviada para o Escudo do Mestre. Suas alterações na biblioteca não vão atualizar lá até você sincronizar novamente.</p>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-gray-900"></div>
                        <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Jogadores Conectados</h4>
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-gray-900"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {campaign.players.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => { if(userRole === 'mestre') setViewingPlayer(p); }}
                            className={`bg-black/40 border border-gray-900 p-4 rounded-xl ${userRole === 'mestre' ? 'cursor-pointer hover:border-blood transition-colors group' : ''}`}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-xs font-bold text-white truncate max-w-[120px] ${userRole === 'mestre' ? 'group-hover:text-blood' : ''}`}>{p.characterName}</span>
                              <div className="flex gap-1 w-12">
                                <div className="h-1 flex-1 bg-gray-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-600" style={{ width: `${(p.currentHp/(p.maxHp||1))*100}%` }}></div>
                                </div>
                                <div className="h-1 flex-1 bg-gray-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600" style={{ width: `${(p.currentPd/(p.maxPd||1))*100}%` }}></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold">
                              <span>NEX {p.level * 5}%</span>
                              <span className="flex items-center gap-1"><Shield size={10}/> DEF</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ESCUDO DO MESTRE */}
                    {userRole === 'mestre' && (
                      <div className="border-t border-gray-900 pt-8 mt-4">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-xl font-serif text-white flex items-center gap-2">
                            <Skull size={20} className="text-blood" /> Painel de Ameaças
                          </h4>
                          <button 
                            onClick={async () => {
                              const name = await askCustom("Nome da Ameaça:");
                              if (name) {
                                const hpStr = await askCustom("Vida Total (Ex: 100):", "50");
                                const threat: Threat = {
                                  id: Math.random().toString(36).substr(2, 9),
                                  name,
                                  attributes: { AGI: 2, FOR: 2, INT: 2, VIG: 2, PRE: 2 },
                                  skills: {},
                                  currentHp: parseInt(hpStr||'50'),
                                  maxHp: parseInt(hpStr||'50'),
                                  currentPd: 0,
                                  maxPd: 0,
                                  abilities: [],
                                  inventory: [],
                                  rituals: [],
                                  isThreat: true
                                };
                                syncThreat(threat);
                              }
                            }}
                            className="bg-black/60 border border-blood py-2 px-6 rounded-lg text-white font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-blood transition-all"
                          >
                            <Plus size={14} /> Nova Ameaça
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {campaign.threats.map(t => (
                            <div key={t.id} className="bg-black/20 border border-gray-900 p-5 rounded-2xl group hover:border-blood/50 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div className="cursor-pointer flex-1" onClick={() => setSelectedThreatId(t.id)}>
                                  <h5 className="text-white font-bold hover:text-blood transition-colors text-lg">{t.name}</h5>
                                  <p className="text-[10px] text-gray-500 uppercase font-mono mt-1">PV {t.currentHp}/{t.maxHp}</p>
                                </div>
                                <button onClick={() => deleteThreat(t.id)} className="text-gray-800 hover:text-blood">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-blood" style={{ width: `${(t.currentHp/t.maxHp)*100}%` }}></div>
                              </div>
                              <div className="grid grid-cols-5 gap-1">
                                {Object.entries(t.attributes).map(([a, v]) => (
                                  <div key={a} className="text-center bg-black/40 rounded py-1">
                                    <div className="text-[7px] text-gray-600 font-bold uppercase">{a}</div>
                                    <div className="text-xs text-white font-bold">{v}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : isCreating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/90 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-void blood-border rounded-2xl p-8 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-blood-dark">
              <h2 className="text-2xl font-serif text-white tracking-widest">NOVO AGENTE</h2>
              <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white"><X /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Nome do Jogador</label>
                  <input 
                    className="w-full bg-black blood-border rounded p-3 text-white outline-none focus:border-blood transition-colors"
                    placeholder="Seu nome"
                    value={newChar.playerName}
                    onChange={e => setNewChar({...newChar, playerName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Nome do Personagem</label>
                  <input 
                    className="w-full bg-black blood-border rounded p-3 text-white outline-none focus:border-blood transition-colors"
                    placeholder="Nome do agente"
                    value={newChar.characterName}
                    onChange={e => setNewChar({...newChar, characterName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Classe</label>
                  <select 
                    className="w-full bg-black blood-border rounded p-3 text-white outline-none"
                    value={newChar.class}
                    onChange={e => {
                      const val = e.target.value as ClassType;
                      setNewChar({
                        ...newChar, 
                        class: val, 
                        trackPath: SYSTEM_DATA.classes[val].tracks[0] 
                      });
                    }}
                  >
                    <option value="Combatente">Combatente</option>
                    <option value="Especialista">Especialista</option>
                    <option value="Ocultista">Ocultista</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Trilha</label>
                  <select 
                    className="w-full bg-black blood-border rounded p-3 text-white outline-none"
                    value={newChar.trackPath}
                    onChange={e => setNewChar({...newChar, trackPath: e.target.value})}
                  >
                    {SYSTEM_DATA.classes[newChar.class as ClassType]?.tracks.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Origem</label>
                  <select 
                    className="w-full bg-black blood-border rounded p-3 text-white outline-none"
                    value={newChar.origin}
                    onChange={async (e) => {
                      if (e.target.value === 'custom_origin') {
                         const name = await askCustom("Nome da Origem Customizada:");
                         if (name) {
                            const skillsStr = await askCustom("Quais as 2 perícias treinadas? (Separadas por vírgula, Ex: Luta, Ocultismo)");
                            const abilityName = await askCustom("Nome da Habilidade de Origem:");
                            const abilityDesc = await askCustom("Descrição da Habilidade:");
                            
                            setNewChar({
                              ...newChar,
                              origin: name,
                              customOriginData: {
                                skills: skillsStr ? skillsStr.split(',').map(s => s.trim()) : [],
                                ability: {
                                  id: Math.random().toString(),
                                  name: abilityName || "Poder Customizado",
                                  description: abilityDesc || "",
                                  source: 'Origem'
                                }
                              }
                            });
                         }
                      } else {
                        setNewChar({...newChar, origin: e.target.value, customOriginData: undefined});
                      }
                    }}
                  >
                    {SYSTEM_DATA.origins.map(o => (
                      <option key={o.name} value={o.name}>{o.name}</option>
                    ))}
                    <option value="custom_origin" className="text-blood font-bold">+ Criar Customizada...</option>
                    {newChar.customOriginData && <option value={newChar.origin}>{newChar.origin} (Custom)</option>}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-center block">Atributos Básicos</label>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                  {(['AGI', 'FOR', 'INT', 'VIG', 'PRE'] as Attribute[]).map(attr => (
                    <AttributeHex 
                      key={attr} 
                      label={attr} 
                      value={newChar.attributes![attr]} 
                      onChange={(val) => setNewChar({
                        ...newChar, 
                        attributes: { ...newChar.attributes!, [attr]: val }
                      })}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-8 text-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createCharacter}
                  className="bg-blood hover:bg-blood-dark text-white px-12 py-3 rounded-full font-serif tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(178,34,34,0.3)]"
                >
                  Concluir Registro
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        selectedChar && (
          <div className="max-w-7xl mx-auto w-full flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Top Bar */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 p-6 bg-void blood-border rounded-2xl">
              <div className="flex gap-4 items-center">
                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <X />
                </button>
                <div className="w-20 h-20 bg-gray-800 rounded-full blood-border relative overflow-hidden group cursor-pointer">
                   <div className="w-full h-full flex items-center justify-center text-3xl font-serif text-blood">
                      {(selectedChar.characterName || 'A')[0]}
                   </div>
                </div>
                <div>
                  <h1 className="text-3xl font-serif text-white tracking-wider uppercase">{selectedChar.characterName || 'Agente'}</h1>
                  <div className="flex gap-2 items-center flex-wrap">
                    <p className="text-xs text-blood font-bold tracking-widest uppercase">
                      {(selectedChar.class || 'N/A')} • 
                    </p>
                    <input 
                      type="text" 
                      value={selectedChar.trackPath || ''}
                      onChange={(e) => updateCharacter({ trackPath: e.target.value })}
                      className="bg-transparent text-xs text-blood font-bold tracking-widest uppercase outline-none w-24 border-b border-blood/20 focus:border-blood"
                    />
                    <span className="text-blood">•</span>
                    <input 
                      type="text" 
                      value={selectedChar.origin}
                      onChange={(e) => updateCharacter({ origin: e.target.value })}
                      className="bg-transparent text-xs text-blood font-bold tracking-widest uppercase outline-none w-24 border-b border-blood/20 focus:border-blood"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 max-w-xl">
                <ProgressBar 
                  label="Pontos de Vida" 
                  current={selectedChar.currentHp} 
                  max={selectedChar.maxHp} 
                  colorClass="bg-red-600" 
                  icon={Heart} 
                  onUpdate={(val) => updateCharacter({ currentHp: val })}
                  onUpdateMax={(val) => updateCharacter({ maxHp: val })}
                />
                <ProgressBar 
                  label="Determinação (PD)" 
                  current={selectedChar.currentPd} 
                  max={selectedChar.maxPd} 
                  colorClass="bg-blue-600" 
                  icon={Brain} 
                  onUpdate={(val) => updateCharacter({ currentPd: val })}
                  onUpdateMax={(val) => updateCharacter({ maxPd: val })}
                />
              </div>
            </header>

            <main className="grid grid-cols-12 gap-6 flex-1">
              {/* Attributes Sidebar */}
              <section className="col-span-12 lg:col-span-3 bg-void blood-border rounded-xl p-6 flex flex-col gap-8 h-fit">
                <div>
                  <h3 className="text-xs font-bold text-blood border-b border-blood-dark pb-2 mb-6 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} /> Atributos
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4 py-2">
                    {(['AGI', 'FOR', 'INT', 'VIG', 'PRE'] as Attribute[]).map(attr => (
                      <AttributeHex 
                        key={attr} 
                        label={attr} 
                        value={selectedChar.attributes[attr]} 
                        onChange={(val) => updateCharacter({ attributes: { ...selectedChar.attributes, [attr]: val } })}
                      />
                    ))}
                  </div>
                </div>

                <div>
                   <h3 className="text-xs font-bold text-blood border-b border-blood-dark pb-2 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Sword size={14} /> Defesas & Resistências
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-black/40 rounded border border-gray-900">
                      <span className="text-gray-400">Defesa</span>
                      <span className="text-white font-bold">{defense}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-black/40 rounded border border-gray-900">
                      <span className="text-gray-400">Esquiva (+REF)</span>
                      <span className="text-white font-bold">{defense + (selectedChar.skills['Reflexos'] || 0) + (selectedChar.skillBonuses['Reflexos'] || 0)}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Main Interaction Area */}
              <section className="col-span-12 lg:col-span-6 bg-void blood-border rounded-xl flex flex-col h-[700px]">
                <div className="flex border-b border-blood-dark overflow-x-auto">
                  {(['pericias', 'combate', 'habilidades', 'rituais', 'inventario'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 min-w-[80px] py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        activeTab === tab ? 'text-blood bg-blood-dark/10 border-b-2 border-blood' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                  <AnimatePresence mode="wait">
                    {activeTab === 'pericias' && (
                      <motion.div key="pericias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        <div className="flex justify-between items-center text-[8px] uppercase font-bold text-gray-600 mb-2 px-3">
                           <span>Perícia</span>
                           <div className="flex gap-12">
                              <span>Treino</span>
                              <span>Personalizado</span>
                              <span>Total</span>
                           </div>
                        </div>
                        {SKILLS_LIST.map(skill => {
                          const value = selectedChar.skills[skill] || 0;
                          const bonus = selectedChar.skillBonuses[skill] || 0;
                          return (
                            <div key={skill} className="flex justify-between items-center group p-3 bg-black/20 hover:bg-blood-dark/10 rounded-lg border border-transparent hover:border-blood-dark transition-all">
                              <div className="flex items-center gap-3">
                                <span className={value + bonus > 0 ? "text-white" : "text-gray-500"}>{skill}</span>
                                {SYSTEM_DATA.origins.find(o => o.name === selectedChar.origin)?.skillBonus.includes(skill) && (
                                  <span className="text-[8px] bg-blood-dark px-1 rounded text-white uppercase">Origem</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono w-8 text-center ${value > 0 ? "text-blood" : "text-gray-700"}`}>+{value}</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => updateCharacter({ skills: { ...selectedChar.skills, [skill]: Math.max(0, value - 5) } })} className="p-1 hover:text-white">-</button>
                                    <button onClick={() => updateCharacter({ skills: { ...selectedChar.skills, [skill]: value + 5 } })} className="p-1 hover:text-white">+</button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 border-l border-gray-900 pl-4">
                                  <input 
                                    type="number" 
                                    value={bonus} 
                                    onChange={(e) => updateCharacter({ skillBonuses: { ...selectedChar.skillBonuses, [skill]: parseInt(e.target.value) || 0 } })}
                                    className="w-10 bg-transparent text-center font-mono text-blood outline-none"
                                  />
                                </div>
                                <div className="w-12 text-center border-l border-gray-900 pl-4">
                                  <span className="font-mono text-white font-bold">+{value + bonus}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}

                    {activeTab === 'combate' && (
                      <motion.div key="combate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                           <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Ataques & Armas Equipadas</h4>
                           {selectedChar.inventory.filter(i => i.isWeapon && i.equipped).map(weapon => {
                              const weaponSkill = weapon.skillUsed || (weapon.damage?.includes('d10') || weapon.damage?.includes('d12') ? 'Pontaria' : 'Luta');
                              const skillValue = selectedChar.skills[weaponSkill] || 0;
                              const skillBonus = selectedChar.skillBonuses[weaponSkill] || 0;
                              
                              let attackAttributeBonus = selectedChar.attributes.AGI; 
                              if (weaponSkill === 'Luta' && selectedChar.attributes.FOR > selectedChar.attributes.AGI) attackAttributeBonus = selectedChar.attributes.FOR;

                              let attackBonus = attackAttributeBonus + skillValue + skillBonus;
                              let dmgBonus = 0;
                              let critR = weapon.critRange || 20;
                              let critM = weapon.critMultiplier || 2;

                              weapon.modifications?.forEach(mid => {
                                const mod = SYSTEM_DATA.modifications.find(m => m.id === mid);
                                if (mid === 'm1') critR -= 1; // Alvejante
                                if (mid === 'm2') attackBonus += 2; // Certeira
                                if (mid === 'm3') dmgBonus += 2; // Cruel
                              });
                              
                              return (
                                <div key={weapon.id} className="bg-blood-dark/10 p-4 rounded-lg border border-blood-dark group hover:bg-blood-dark/20 transition-all">
                                   <div className="flex justify-between items-start mb-3">
                                     <div>
                                       <p className="text-white font-bold text-sm tracking-wide">{weapon.name}</p>
                                       <div className="flex items-center gap-2 mt-1">
                                          <select 
                                            value={weaponSkill}
                                            onChange={(e) => {
                                              updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === weapon.id ? { ...i, skillUsed: e.target.value } : i) });
                                            }}
                                            className="bg-black/40 text-[9px] uppercase font-bold text-gray-400 border border-gray-800 rounded px-1 outline-none"
                                          >
                                            {SKILLS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                          </select>
                                          <span className="text-[9px] text-gray-500">• Crítico: {critR}/x{critM}</span>
                                       </div>
                                     </div>
                                     <div className="flex gap-2">
                                       <button 
                                         onClick={() => {
                                           const res = rollDice('1d20');
                                           const total = res.total + attackBonus;
                                           logRoll(`Ataque: ${weapon.name}`, res, attackBonus);
                                           if (res.total >= critR) {
                                              alertCustom(`CRÍTICO! Ganhou no dado ${res.total}. Total: ${total}`);
                                           }
                                         }}
                                         className="flex flex-col items-center justify-center bg-gray-900 border border-gray-800 px-3 py-1 rounded hover:bg-blood/20 transition-colors"
                                       >
                                         <span className="text-[8px] text-gray-500 font-bold uppercase">Ataque</span>
                                         <span className="text-sm font-bold text-white">+{attackBonus}</span>
                                       </button>
                                       <button 
                                         onClick={() => {
                                           const res = rollDice(weapon.damage || '1d4');
                                           logRoll(`Dano: ${weapon.name}`, res, dmgBonus);
                                         }}
                                         className="flex flex-col items-center justify-center bg-blood px-3 py-1 rounded hover:scale-105 transition-transform"
                                       >
                                         <span className="text-[8px] text-white/70 font-bold uppercase">Dano</span>
                                         <span className="text-sm font-bold text-white">{weapon.damage}{dmgBonus > 0 ? `+${dmgBonus}` : ''}</span>
                                       </button>
                                       <button 
                                         onClick={() => {
                                           const diceStr = weapon.damage || '1d4';
                                           const match = diceStr.match(/^(\d*)d(.+)$/);
                                           if (match) {
                                              const count = parseInt(match[1] || '1');
                                              const critDice = `${count * critM}d${match[2]}`;
                                              const res = rollDice(critDice);
                                              logRoll(`CRÍTICO: ${weapon.name}`, res, dmgBonus);
                                           }
                                         }}
                                         className="flex flex-col items-center justify-center bg-gray-900 border border-gray-800 px-3 py-1 rounded hover:bg-blood transition-colors"
                                       >
                                         <span className="text-[8px] text-gray-500 font-bold uppercase">Crítico</span>
                                         <span className="text-sm font-bold text-white">x{critM}</span>
                                       </button>
                                     </div>
                                   </div>
                                   <p className="text-[10px] text-gray-500 italic line-clamp-1">{weapon.description}</p>
                                </div>
                              );
                            })}
                           {selectedChar.inventory.filter(i => i.isWeapon && i.equipped).length === 0 && (
                             <p className="text-xs text-gray-600 italic text-center py-4">Nenhuma arma equipada no inventário.</p>
                           )}
                           
                           <h4 className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mt-4">Habilidades & Poderes de Combate</h4>
                            {selectedChar.abilities.filter(a => a.source === 'Classe' || a.source === 'Trilha' || a.showInCombat).map(ability => (
                              <div key={ability.id} className="bg-black/40 p-4 border border-gray-800 rounded-lg relative group">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-bold text-white text-sm tracking-wide">{ability.name}</h4>
                                    <span className="text-[8px] uppercase text-blood font-bold">{ability.source}</span>
                                  </div>
                                  {ability.name === 'Ataque Especial' ? (
                                    <button 
                                      onClick={rollSpecialAttack}
                                      className="bg-blood px-3 py-1 rounded text-[10px] font-bold text-white uppercase hover:scale-105 transition-transform"
                                    >
                                      Usar (2 PD)
                                    </button>
                                  ) : (ability.cost !== undefined || ability.showInCombat) ? (
                                    <button 
                                      onClick={async () => {
                                        let allowed = true;
                                        if (ability.cost) {
                                          allowed = await spendPd(ability.cost);
                                        }
                                        if (allowed) {
                                          if (ability.actionFormula) {
                                            const res = rollDice(ability.actionFormula);
                                            logRoll(`${ability.name}`, res); 
                                          } else {
                                            logRoll(`Usou: ${ability.name}`, {total: 0, rolls: []}, ability.cost ? -ability.cost : 0);
                                          }
                                        }
                                      }}
                                      className="bg-blood/80 border border-blood px-3 py-1 rounded text-[10px] font-bold text-white uppercase hover:scale-105 transition-transform"
                                    >
                                      Usar {ability.cost ? `(${ability.cost} PD)` : ''}
                                    </button>
                                  ) : null}
                                </div>
                                <p className="text-[11px] text-gray-400 italic mt-2 whitespace-pre-wrap">{ability.description}</p>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'habilidades' && (
                      <motion.div key="habilidades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="flex border-b border-gray-900 mb-4 overflow-x-auto no-scrollbar">
                           {(['classe', 'trilha', 'origem', 'poderes_gerais', 'poderes_paranormais'] as const).map(sub => (
                             <button 
                                key={sub}
                                onClick={() => setActiveSubTab(sub as any)}
                                className={`px-4 py-2 text-[8px] uppercase font-bold tracking-tighter whitespace-nowrap ${activeSubTab === sub ? 'text-blood border-b border-blood' : 'text-gray-600'}`}
                             >
                               {sub === 'origem' ? 'Origem' : sub.replace('_', ' ')}
                             </button>
                           ))}
                        </div>

                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-[10px] font-bold text-blood uppercase tracking-widest">
                             {activeSubTab === 'trilha' ? `Trilha: ${selectedChar.trackPath || 'Nenhuma'}` : activeSubTab === 'origem' ? `Origem: ${selectedChar.origin}` : activeSubTab.replace('_', ' ')}
                           </h3>
                           <button 
                            onClick={async () => {
                              const name = await askCustom("Nome da Habilidade:");
                              if (!name) return;
                              const desc = await askCustom("Descrição:");
                              const costStr = await askCustom("Custo de PD (vazio se não tiver):", "");
                              const cost = costStr ? parseInt(costStr) : undefined;
                              
                              const showInCombat = await confirmCustom("Mostrar botão de uso na aba de Combate?", "Sim", "Não");
                              let actionFormula = "";
                              if (showInCombat) {
                                actionFormula = await askCustom("Fórmula de rolagem (Ex: 1d6, ou deixe vazio):", "") || "";
                              }
                              
                              const sourceName = activeSubTab === 'classe' ? 'Classe' : activeSubTab === 'trilha' ? 'Trilha' : activeSubTab === 'origem' ? 'Origem' : activeSubTab === 'poderes_gerais' ? 'Poder Geral' : 'Poder Paranormal';

                              const newAbility: Ability = {
                                id: Math.random().toString(),
                                name,
                                description: desc || "",
                                source: sourceName,
                                cost,
                                showInCombat,
                                actionFormula
                              };
                              updateCharacter({ abilities: [...selectedChar.abilities, newAbility] });
                            }}
                            className="text-[8px] uppercase font-bold text-blood hover:text-white border border-blood/30 px-2 py-0.5 rounded"
                           >
                             + Criar Custom
                           </button>
                        </div>

                        {activeSubTab === 'trilha' && (
                           <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                              {SYSTEM_DATA.classes[selectedChar.class].tracks.map(t => (
                                <button 
                                  key={t}
                                  onClick={() => updateCharacter({ trackPath: t })}
                                  className={`px-3 py-1 rounded text-[8px] font-bold uppercase transition-all ${selectedChar.trackPath === t ? 'bg-blood text-white' : 'bg-gray-900 text-gray-500 hover:text-white'}`}
                                >
                                  {t}
                                </button>
                              ))}
                           </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                           {selectedChar.abilities.filter(a => {
                             if (activeSubTab === 'classe') return a.source === 'Classe';
                             if (activeSubTab === 'trilha') return a.source === 'Trilha';
                             if (activeSubTab === 'origem') return a.source === 'Origem';
                             if (activeSubTab === 'poderes_gerais') return a.source === 'Poder Geral';
                             if (activeSubTab === 'poderes_paranormais') return a.source === 'Poder Paranormal';
                             return false;
                           }).map(ability => (
                             <div key={ability.id} className="bg-black/40 p-4 border border-gray-800 rounded-lg group relative">
                                <div className="flex justify-between items-center mb-1">
                                   <div>
                                      <h4 className="font-bold text-white text-sm">{ability.name}</h4>
                                   </div>
                                   {ability.cost !== undefined && (
                                     <button 
                                       onClick={async () => {
                                         if(await spendPd(ability.cost!)) {
                                           if (ability.actionFormula) {
                                              const res = rollDice(ability.actionFormula);
                                              logRoll(`${ability.name}`, res);
                                           } else {
                                              logRoll(`Usou: ${ability.name}`, { total: 0, rolls: [] }, -ability.cost!);
                                           }
                                         }
                                       }}
                                       className="bg-blue-600/10 px-2 py-0.5 border border-blue-600/20 rounded text-blue-500 font-mono text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all uppercase whitespace-nowrap"
                                     >
                                       Usar ({ability.cost} PD)
                                     </button>
                                   )}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2 whitespace-pre-wrap">{ability.description}</p>
                                
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const newName = await askCustom("Editar Nome:", ability.name);
                                    if (newName) {
                                      const newDesc = await askCustom("Editar Descrição:", ability.description);
                                      const costStr = await askCustom("Custo em PD (vazio se não tiver):", ability.cost?.toString() || "");
                                      const cost = costStr ? parseInt(costStr) : undefined;
                                      
                                      const showInCombat = await confirmCustom("Mostrar botão de uso na aba de Combate?", "Sim", "Não");
                                      let actionFormula = "";
                                      if (showInCombat) {
                                        actionFormula = await askCustom("Fórmula de rolagem (Ex: 1d6, ou deixe vazio):", ability.actionFormula || "") || "";
                                      }

                                      updateCharacter({ abilities: selectedChar.abilities.map(a => a.id === ability.id ? { 
                                        ...a, 
                                        name: newName, 
                                        description: newDesc || '',
                                        cost,
                                        showInCombat,
                                        actionFormula
                                      } : a) });
                                    }
                                  }}
                                  className="absolute top-2 right-8 p-1 text-gray-800 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button 
                                  onClick={() => updateCharacter({ abilities: selectedChar.abilities.filter(a => a.id !== ability.id) })}
                                  className="absolute top-2 right-2 p-1 text-gray-800 hover:text-blood opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={14} />
                                </button>
                             </div>
                           ))}

                           {activeSubTab !== 'origem' && (
                             <div className="mt-8 border-t border-gray-900 pt-4">
                                <h4 className="text-[8px] uppercase text-gray-600 font-bold mb-3 tracking-widest">Opções do Sistema</h4>
                                <div className="grid grid-cols-1 gap-2">
                                   {((activeSubTab === 'trilha' ? SYSTEM_DATA.trackAbilities[selectedChar.class]?.[selectedChar.trackPath] : activeSubTab === 'poderes_gerais' ? SYSTEM_DATA.generalPowers : activeSubTab === 'poderes_paranormais' ? SYSTEM_DATA.paranormalPowers : []) || []).filter(opt => !selectedChar.abilities.find(a => a.name === opt.name)).map(opt => (
                                     <div key={opt.id} className="flex justify-between items-center bg-gray-900/30 p-2 rounded border border-gray-900 hover:border-blood/30 transition-all group">
                                        <div>
                                           <h5 className="text-xs text-gray-300 font-bold">{opt.name}</h5>
                                           <p className="text-[9px] text-gray-500 line-clamp-1 group-hover:line-clamp-none transition-all">{opt.description}</p>
                                        </div>
                                        <button 
                                          onClick={() => updateCharacter({ abilities: [...selectedChar.abilities, { ...opt, id: Math.random().toString(), source: activeSubTab === 'trilha' ? 'Trilha' : activeSubTab === 'poderes_gerais' ? 'Poder Geral' : 'Poder Paranormal' }] })}
                                          className="text-blood p-1 hover:text-white"
                                        >
                                          <Plus size={14} />
                                        </button>
                                     </div>
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'rituais' && (
                      <motion.div key="rituais" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[10px] bg-blood/20 px-3 py-1 rounded-full text-blood font-bold uppercase border border-blood whitespace-nowrap">DT Ritual: {10 + Math.floor(selectedChar.level * 0.5) + selectedChar.attributes.PRE + (selectedChar.skills['Ocultismo'] || 0)}</span>
                          <div className="flex gap-2">
                             <select 
                                className="bg-black text-[10px] uppercase font-bold text-gray-500 border border-gray-800 rounded px-2 outline-none w-32"
                                onChange={(e) => {
                                  if(!e.target.value) return;
                                  const ritual = SYSTEM_DATA.rituals.find(r => r.id === e.target.value);
                                  if(ritual) updateCharacter({ rituals: [...selectedChar.rituals, { ...ritual, id: Math.random().toString() }] });
                                  e.target.value = "";
                                }}
                             >
                                <option value="">+ Do Livro</option>
                                {SYSTEM_DATA.rituals.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} ({r.element})</option>
                                ))}
                             </select>
                             <button 
                               onClick={async () => {
                                 const name = await askCustom("Nome do Ritual:");
                                 if (!name) return;
                                 const dmg = await askCustom("Dano Padrão (Ex: 2d8):", "1d6");
                                 const costStr = await askCustom("Custo PD Padrão:", "1");
                                 const cost = parseInt(costStr || "1");
                                 const discDmg = await askCustom("Dano Discente (Vazio se não tiver):", "");
                                 const discCostStr = await askCustom("Custo PD EXTRA Discente (Ex: 2):", "");
                                 const trueDmg = await askCustom("Dano Verdadeiro (Vazio se não tiver):", "");
                                 const trueCostStr = await askCustom("Custo PD EXTRA Verdadeiro (Ex: 4):", "");
                                 
                                 const newRitual: Ritual = {
                                   id: Math.random().toString(),
                                   name,
                                   description: "Ritual customizado. Edite a descrição no ícone de lápis.",
                                   damage: dmg || undefined,
                                   cost,
                                   discenteDamage: discDmg || undefined,
                                   discenteExtraCost: discCostStr ? parseInt(discCostStr) : undefined,
                                   trueDamage: trueDmg || undefined,
                                   trueExtraCost: trueCostStr ? parseInt(trueCostStr) : undefined,
                                   source: 'Ritual',
                                   circle: 1,
                                   element: 'Medo',
                                   execution: 'Padrão',
                                   range: 'Curto',
                                   target: '1 ser',
                                   duration: 'Instantânea'
                                 };
                                 updateCharacter({ rituals: [...selectedChar.rituals, newRitual] });
                               }}
                               className="p-1 px-2 bg-void blood-border rounded text-blood text-[10px] font-bold uppercase"
                             >
                               + Homebrew
                             </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {selectedChar.rituals.map(ritual => (
                            <div key={ritual.id} className="bg-black/60 p-4 border border-gray-800 rounded-lg group transition-all relative overflow-hidden">
                              <div className="flex justify-between items-start mb-2 relative z-10">
                                <div>
                                  <h4 className="font-bold text-white text-lg tracking-wide">{ritual.name}</h4>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[8px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 font-bold uppercase">{ritual.element}</span>
                                    <span className="text-[8px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 font-bold uppercase">{ritual.execution}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-blue-500 font-mono text-xs block font-bold">{ritual.cost} PD</span>
                                </div>
                              </div>
                              <p className="text-[11px] text-gray-400 italic mb-4 whitespace-pre-wrap">{ritual.description}</p>
                              
                              <div className="flex flex-col gap-2 mt-4">
                                 <button 
                                   onClick={async () => {
                                      if(await spendPd(ritual.cost!)) {
                                        const res = ritual.damage ? rollDice(ritual.damage) : { total: 0, rolls: [] };
                                        logRoll(`${ritual.name} (Padrão)`, res);
                                      }
                                   }}
                                   className="w-full flex justify-between items-center bg-blue-600/10 hover:bg-blue-600/30 p-2 rounded border border-blue-600/20 transition-all group"
                                 >
                                    <span className="text-[10px] font-bold uppercase text-white">Versão Padrão</span>
                                    <span className="text-[10px] font-mono text-blue-500">{ritual.damage || '-'}</span>
                                 </button>
                                 {(ritual.discenteDamage || ritual.discenteExtraCost) && (
                                   <button 
                                     onClick={async () => {
                                        if(await spendPd(ritual.cost! + (ritual.discenteExtraCost || 0))) {
                                          const res = ritual.discenteDamage ? rollDice(ritual.discenteDamage) : { total: 0, rolls: [] };
                                          logRoll(`${ritual.name} (Discente)`, res);
                                        }
                                     }}
                                     className="w-full flex justify-between items-center bg-yellow-600/10 hover:bg-yellow-600/30 p-2 rounded border border-yellow-600/20 transition-all"
                                   >
                                      <span className="text-[10px] font-bold uppercase text-white">Versão Discente (+{ritual.discenteExtraCost} PD)</span>
                                      <span className="text-[10px] font-mono text-yellow-600">{ritual.discenteDamage || '-'}</span>
                                   </button>
                                 )}
                                 {(ritual.trueDamage || ritual.trueExtraCost) && (
                                   <button 
                                     onClick={async () => {
                                        if(await spendPd(ritual.cost! + (ritual.trueExtraCost || 0))) {
                                          const res = ritual.trueDamage ? rollDice(ritual.trueDamage) : { total: 0, rolls: [] };
                                          logRoll(`${ritual.name} (Verdadeiro)`, res);
                                        }
                                     }}
                                     className="w-full flex justify-between items-center bg-purple-600/10 hover:bg-purple-600/30 p-2 rounded border border-purple-600/20 transition-all"
                                   >
                                      <span className="text-[10px] font-bold uppercase text-white">Versão Verdadeira (+{ritual.trueExtraCost} PD)</span>
                                      <span className="text-[10px] font-mono text-purple-600">{ritual.trueDamage || '-'}</span>
                                   </button>
                                 )}
                              </div>

                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newName = await askCustom("Editar Nome:", ritual.name);
                                  if (newName) {
                                    const newDesc = await askCustom("Editar Descrição:", ritual.description);
                                    updateCharacter({ rituals: selectedChar.rituals.map(r => r.id === ritual.id ? { ...r, name: newName, description: newDesc || '' } : r) });
                                  }
                                }}
                                className="absolute top-2 right-8 p-1 text-gray-800 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit3 size={14} />
                              </button>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCharacter({ rituals: selectedChar.rituals.filter(r => r.id !== ritual.id) });
                                }}
                                className="absolute top-2 right-2 p-1 text-gray-800 hover:text-blood opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'inventario' && (
                      <motion.div key="inventario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div className="flex items-center gap-4">
                             <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Capacidade de Carga</div>
                             <div className="bg-black/60 px-3 py-1 rounded blood-border text-xs">
                                <span className={selectedChar.inventory.reduce((acc, i) => acc + i.space, 0) > (2 + selectedChar.attributes.FOR) * 2 ? 'text-red-500' : 'text-blood'}>
                                  {selectedChar.inventory.reduce((acc, i) => acc + i.space, 0)}
                                </span>
                                <span className="text-gray-600"> / {(2 + selectedChar.attributes.FOR) * 2}</span>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <select 
                                className="bg-black text-[10px] uppercase font-bold text-gray-500 border border-gray-800 rounded px-2 outline-none w-32"
                                onChange={(e) => {
                                  if(!e.target.value) return;
                                  const base = SYSTEM_DATA.items.find(i => i.id === e.target.value);
                                  if(base) updateCharacter({ inventory: [...selectedChar.inventory, { ...base, id: Math.random().toString(), modifications: [], curses: [] }] });
                                  e.target.value = "";
                                }}
                             >
                                <option value="">+ Do Livro</option>
                                {SYSTEM_DATA.items.map(i => (
                                  <option key={i.id} value={i.id}>{i.name} (Cat {i.baseCategory})</option>
                                ))}
                             </select>
                             <button 
                                onClick={async () => {
                                  const itemName = await askCustom("Nome do Item:");
                                  if (!itemName) return;
                                  const spaceStr = await askCustom("Espaço de carga (Ex: 1):", "1");
                                  const space = parseInt(spaceStr || '1');
                                  const isWeapon = await confirmCustom("É uma arma?", "Sim", "Não");
                                  let damage = "";
                                  if (isWeapon) damage = await askCustom("Dano da arma (Ex: 1d8):", "1d8") || "1d8";
                                  const isArmor = !isWeapon && await confirmCustom("É uma proteção/armadura?", "Sim", "Não");
                                  let defBonus = 0;
                                  if (isArmor) {
                                    const defStr = await askCustom("Bônus na Defesa:", "5");
                                    defBonus = parseInt(defStr || "0");
                                  }
                                  const catStr = await askCustom("Categoria Base (0-4):", "0");
                                  const category = parseInt(catStr || "0");
                                  
                                  const newItem: Item = {
                                    id: Math.random().toString(),
                                    name: itemName,
                                    space: isNaN(space) ? 1 : space,
                                    baseCategory: category,
                                    category: category,
                                    description: "Item customizado. Clique no item para editar a descrição.",
                                    isWeapon,
                                    isArmor,
                                    damage: isWeapon ? damage : undefined,
                                    defenseBonus: isArmor ? defBonus : undefined,
                                    equipped: false,
                                    modifications: [],
                                    curses: []
                                  };
                                  updateCharacter({ inventory: [...selectedChar.inventory, newItem] });
                                }}
                                className="bg-void border border-dashed border-gray-700 px-3 py-1.5 text-[10px] font-bold uppercase text-gray-500 hover:text-blood hover:border-blood transition-all"
                              >
                                + Homebrew
                              </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                           {selectedChar.inventory.map(item => {
                             const totalCat = (item.baseCategory || 0) + 
                               (item.modifications?.reduce((acc, mid) => acc + (SYSTEM_DATA.modifications.find(m => m.id === mid)?.categoryCost || 0), 0) || 0) +
                               (item.curses?.reduce((acc, cid) => acc + (SYSTEM_DATA.curses.find(c => c.id === cid)?.categoryCost || 0), 0) || 0);

                             return (
                               <div key={item.id} className="flex flex-col">
                                 <div 
                                   onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                                   className={`flex justify-between items-center p-3 bg-black/40 rounded-lg border-l-2 transition-all cursor-pointer hover:bg-black/60 ${item.equipped ? 'border-blood' : 'border-gray-800'} ${selectedItemId === item.id ? 'bg-black/60 shadow-[inset_0_0_10px_rgba(178,34,34,0.1)]' : ''}`}
                                 >
                                   <div className="flex items-center gap-4">
                                      <input 
                                        type="checkbox" 
                                        checked={item.equipped} 
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          updateCharacter({ 
                                            inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, equipped: e.target.checked } : i)
                                          });
                                        }}
                                        className="accent-blood"
                                      />
                                     <div>
                                        <h4 className={`text-sm font-bold ${item.equipped ? 'text-white' : 'text-gray-500'}`}>{item.name}</h4>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center mt-1">
                                          <span className="text-[8px] bg-gray-900 border border-gray-800 px-1 rounded text-blood font-bold uppercase tracking-tighter">Cat {totalCat}</span>
                                          <p className="text-[10px] text-gray-600 font-medium">
                                            {item.isWeapon ? `Dano: ${item.damage}` : item.isArmor ? `Prot: +${item.defenseBonus}` : 'Equipamento'}
                                          </p>
                                          {item.isWeapon && (
                                            <div className="flex gap-2 text-[9px] text-gray-700">
                                              <span>Base: {item.critRange || 20}/x{item.critMultiplier || 2}</span>
                                              <span>Perícia: {item.skillUsed || 'Luta/Pontaria'}</span>
                                            </div>
                                          )}
                                        </div>
                                     </div>
                                   </div>
                                   <div className="flex items-center gap-4">
                                     <span className="text-xs text-gray-600 font-mono italic">{item.space} Peso</span>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); updateCharacter({ inventory: selectedChar.inventory.filter(i => i.id !== item.id) }); }}
                                        className="text-gray-800 hover:text-blood transition-opacity"
                                     >
                                        <Trash2 size={14} />
                                     </button>
                                   </div>
                                 </div>

                                 {/* Enhancements Drawer */}
                                 {selectedItemId === item.id && (
                                   <motion.div 
                                     initial={{ height: 0, opacity: 0 }}
                                     animate={{ height: 'auto', opacity: 1 }}
                                     className="bg-black/20 border-x border-b border-gray-900 rounded-b-lg p-4 space-y-4"
                                   >
                                      <div className="mb-4 border-b border-gray-900 pb-4">
                                        <label className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Nome do Item</label>
                                        <input 
                                          type="text" 
                                          value={item.name || ''}
                                          onChange={(e) => updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, name: e.target.value } : i) })}
                                          className="bg-black/40 border border-gray-800 rounded w-full text-sm p-2 text-white mb-3 outline-none"
                                        />
                                        
                                        <label className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Descrição / Notas</label>
                                        <textarea 
                                          value={item.description || ''}
                                          onChange={(e) => updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, description: e.target.value } : i) })}
                                          className="bg-black/40 border border-gray-800 rounded w-full text-xs p-2 text-gray-400 min-h-[60px] outline-none resize-y"
                                        />
                                      </div>

                                      {item.isWeapon && (
                                        <div className="grid grid-cols-4 gap-4 mb-4 border-b border-gray-900 pb-4">
                                          <div>
                                            <label className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Dano</label>
                                            <input 
                                              type="text" 
                                              value={item.damage || ''}
                                              onChange={(e) => updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, damage: e.target.value } : i) })}
                                              className="bg-black/40 border border-gray-800 rounded w-full text-xs p-1 text-white"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Margem</label>
                                            <input 
                                              type="number" 
                                              value={item.critRange || 20}
                                              onChange={(e) => updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, critRange: parseInt(e.target.value) || 20 } : i) })}
                                              className="bg-black/40 border border-gray-800 rounded w-full text-xs p-1 text-white"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Mult. Crítico</label>
                                            <input 
                                              type="number" 
                                              value={item.critMultiplier || 2}
                                              onChange={(e) => updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, critMultiplier: parseInt(e.target.value) || 2 } : i) })}
                                              className="bg-black/40 border border-gray-800 rounded w-full text-xs p-1 text-white"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] uppercase text-gray-600 font-bold block mb-1">Perícia</label>
                                            <select 
                                              value={item.skillUsed || 'Luta'}
                                              onChange={(e) => updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, skillUsed: e.target.value } : i) })}
                                              className="bg-black/40 border border-gray-800 rounded w-full text-xs p-1 text-white outline-none"
                                            >
                                              {SKILLS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      <div>
                                         <div className="flex justify-between items-center mb-3 border-b border-gray-900 pb-1">
                                            <h5 className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Modificações</h5>
                                            <button 
                                              onClick={async () => {
                                                const name = await askCustom("Nome da Modificação:");
                                                if(!name) return;
                                                const costStr = await askCustom("Aumento de Categoria (Ex: 1):", "1");
                                                const cost = parseInt(costStr || "1");
                                                const newMod: Modification = { id: Math.random().toString(), name, categoryCost: cost, description: "", type: item.isWeapon ? 'Arma' : item.isArmor ? 'Armadura' : 'Acessório' };
                                                updateCharacter({ 
                                                  customModifications: [...(selectedChar.customModifications || []), newMod]
                                                });
                                              }}
                                              className="text-[8px] text-blood hover:text-white uppercase font-bold"
                                            >
                                              + Criar Mod
                                            </button>
                                         </div>
                                         <div className="flex flex-wrap gap-2">
                                            {[...SYSTEM_DATA.modifications, ...(selectedChar.customModifications || [])].filter(m => (item.isWeapon && m.type === 'Arma') || (item.isArmor && m.type === 'Armadura') || (!item.isWeapon && !item.isArmor && m.type === 'Acessório')).map(mod => {
                                              const has = item.modifications?.includes(mod.id);
                                              return (
                                                <button 
                                                   key={mod.id}
                                                   onClick={() => {
                                                      const mods = item.modifications ? (has ? item.modifications.filter(mid => mid !== mod.id) : [...item.modifications, mod.id]) : [mod.id];
                                                      updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, modifications: mods } : i) });
                                                   }}
                                                   className={`px-2 py-1 rounded text-[8px] font-bold uppercase transition-all border ${has ? 'bg-blood/20 border-blood text-white' : 'bg-gray-900 border-gray-800 text-gray-600 hover:border-gray-600'}`}
                                                >
                                                   {mod.name} (+{mod.categoryCost})
                                                </button>
                                              );
                                            })}
                                         </div>
                                      </div>
                                      <div>
                                         <div className="flex justify-between items-center mb-3 border-b border-gray-900 pb-1">
                                            <h5 className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Maldições</h5>
                                            <button 
                                              onClick={async () => {
                                                const name = await askCustom("Nome da Maldição:");
                                                if(!name) return;
                                                const costStr = await askCustom("Aumento de Categoria (Ex: 1):", "1");
                                                const cost = parseInt(costStr || "1");
                                                const element = (await askCustom("Elemento (Sangue, Morte, Energia, Conhecimento, Medo):", "Sangue") || "Sangue") as any;
                                                const newCurse: Curse = { id: Math.random().toString(), name, categoryCost: cost, description: "", element, type: item.isWeapon ? 'Arma' : item.isArmor ? 'Armadura' : 'Acessório' };
                                                updateCharacter({ 
                                                  customCurses: [...(selectedChar.customCurses || []), newCurse]
                                                });
                                              }}
                                              className="text-[8px] text-blue-400 hover:text-white uppercase font-bold"
                                            >
                                              + Criar Maldição
                                            </button>
                                         </div>
                                         <div className="flex flex-wrap gap-2">
                                            {[...SYSTEM_DATA.curses, ...(selectedChar.customCurses || [])].filter(c => (item.isWeapon && c.type === 'Arma') || (item.isArmor && c.type === 'Armadura') || (!item.isWeapon && !item.isArmor && c.type === 'Acessório')).map(curse => {
                                              const has = item.curses?.includes(curse.id);
                                              return (
                                                <button 
                                                   key={curse.id}
                                                   onClick={() => {
                                                      const curses = item.curses ? (has ? item.curses.filter(cid => cid !== curse.id) : [...item.curses, curse.id]) : [curse.id];
                                                      updateCharacter({ inventory: selectedChar.inventory.map(i => i.id === item.id ? { ...i, curses } : i) });
                                                   }}
                                                   className={`px-2 py-1 rounded text-[8px] font-bold uppercase transition-all border ${has ? 'bg-blue-600/20 border-blue-600 text-white' : 'bg-gray-900 border-gray-800 text-gray-600 hover:border-gray-600'}`}
                                                >
                                                   {curse.name} ({curse.element}) (+{curse.categoryCost})
                                                </button>
                                              );
                                            })}
                                         </div>
                                      </div>
                                   </motion.div>
                                 )}
                               </div>
                             );
                           })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Character Details Sidebar */}
              <section className="col-span-12 lg:col-span-3 space-y-6 h-fit">
                <div className="bg-void blood-border rounded-xl p-6">
                   <h3 className="text-xs font-bold text-blood border-b border-blood-dark pb-2 mb-4 uppercase tracking-widest">Status de NEX</h3>
                   <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold mb-1">
                          <span className="text-gray-500">Exposição Paranormal</span>
                          <div className="flex items-center gap-1">
                             <input 
                               type="number" 
                               value={selectedChar.level * 5} 
                               step={5}
                               min={5}
                               max={99}
                               onChange={(e) => {
                                 const newNex = parseInt(e.target.value) || 5;
                                 const newLevel = Math.max(1, Math.floor(newNex / 5)); // Converte NEX pra Nível
                                 
                                 // Recalcula o HP e PD máximos baseados no novo NEX
                                 const newMaxHp = calculateMaxHp(selectedChar.class, selectedChar.attributes.VIG, newLevel);
                                 const newMaxPd = calculateMaxPd(selectedChar.class, selectedChar.attributes.PRE, newLevel);
                                 
                                 updateCharacter({ 
                                   level: newLevel,
                                   maxHp: newMaxHp,
                                   maxPd: newMaxPd
                                 });
                               }}
                               className="bg-transparent text-right w-12 outline-none text-white text-lg font-bold"
                             />
                             <span className="text-white font-mono">% NEX</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                           <div className="h-full bg-blood" style={{ width: `${(selectedChar.level / 20) * 100}%` }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-2 bg-black/40 rounded border border-gray-900">
                          <span className="block text-[8px] text-gray-500 uppercase font-bold">Patente</span>
                          <input 
                            type="text" 
                            value={selectedChar.rank}
                            onChange={(e) => updateCharacter({ rank: e.target.value })}
                            className="bg-transparent text-[10px] text-white uppercase font-bold text-center outline-none w-full"
                          />
                        </div>
                        <div className="text-center p-2 bg-black/40 rounded border border-gray-900">
                          <span className="block text-[8px] text-gray-500 uppercase font-bold">Limite PD</span>
                          <span className="text-[10px] text-white uppercase font-bold">{selectedChar.level} PD</span>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="bg-void blood-border rounded-xl p-6">
                   <h3 className="text-xs font-bold text-blood border-b border-blood-dark pb-2 mb-4 uppercase tracking-widest">Anotações</h3>
                   <textarea 
                    className="w-full h-32 bg-transparent text-[11px] text-gray-400 italic outline-none resize-none"
                    placeholder="Escreva segredos ou descobertas aqui..."
                   ></textarea>
                </div>
                
                <button 
                  onClick={async () => {
                     updateCharacter({
                        currentHp: selectedChar.maxHp,
                        currentPd: selectedChar.maxPd
                     });
                     await alertCustom("Ação: Dormir/Relaxar aplicada. PV e PD recuperados ao máximo.");
                  }}
                  className="w-full py-3 bg-blood-dark/20 hover:bg-blood/20 border border-blood-dark rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-blood hover:text-white"
                >
                  Dormir / Relaxar
                </button>
              </section>
            </main>
          </div>
        )
      )}

      {/* Roll Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-72 pointer-events-none">
        <AnimatePresence>
          {rolls.map(roll => (
            <motion.div 
              key={roll.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              className="bg-black/80 backdrop-blur-md border border-blood/40 p-4 rounded-xl shadow-[0_0_20px_rgba(178,34,34,0.3)] pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-blood font-bold uppercase tracking-widest">{roll.label}</span>
                <button onClick={() => setRolls(prev => prev.filter(r => r.id !== roll.id))} className="text-gray-600 hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif text-white font-bold">{roll.total}</span>
                <span className="text-[10px] text-gray-500 font-mono italic">{roll.detail}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}