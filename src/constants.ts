import { GameSystemData, Ritual, Item, Ability, Modification, Curse } from './types';

export const SYSTEM_DATA: GameSystemData = {
  origins: [
    { name: 'Acadêmico', description: 'Você é um estudante ou pesquisador dedicado.', skillBonus: ['Ciências', 'Investigação'] },
    { name: 'Agente de Saúde', description: 'Você trabalhou em hospitais ou clínicas.', skillBonus: ['Medicina', 'Percepção'] },
    { name: 'Amnésico', description: 'Você não se lembra de nada do seu passado.', skillBonus: ['Duas quaisquer'] },
    { name: 'Artista', description: 'Você é um mestre da performance.', skillBonus: ['Artes', 'Enganação'] },
    { name: 'Atleta', description: 'Você tem um físico invejável.', skillBonus: ['Atletismo', 'Acrobacia'] },
    { name: 'Chef', description: 'Você domina a arte culinária.', skillBonus: ['Fortitude', 'Vontade'] },
    { name: 'Criminoso', description: 'Você viveu à margem da lei.', skillBonus: ['Crime', 'Furtividade'] },
    { name: 'Cultista Arrependido', description: 'Você já esteve do outro lado.', skillBonus: ['Ocultismo', 'Religião'] },
    { name: 'Engenheiro', description: 'Você entende como as coisas funcionam.', skillBonus: ['Tecnologia', 'Ciências'] },
    { name: 'Executivo', description: 'Você é bom com negócios e pessoas.', skillBonus: ['Diplomacia', 'Profissão'] },
    { name: 'Investigador', description: 'Você tem olho para detalhes.', skillBonus: ['Investigação', 'Percepção'] },
    { name: 'Lutador', description: 'Você sabe como se defender.', skillBonus: ['Luta', 'Reflexos'] },
    { name: 'Magnata', description: 'Você tem vastos recursos financeiros.', skillBonus: ['Diplomacia', 'Instituição'] },
    { name: 'Mercenário', description: 'Você luta por dinheiro ou glória.', skillBonus: ['Iniciativa', 'Intimidação'] },
    { name: 'Militar', description: 'Você serviu nas forças armadas.', skillBonus: ['Pontaria', 'Tática'] },
    { name: 'Operário', description: 'Você está acostumado com o trabalho duro.', skillBonus: ['Fortitude', 'Profissão'] },
    { name: 'Policial', description: 'Você jurou proteger e servir.', skillBonus: ['Investigação', 'Percepção'] },
    { name: 'Religioso', description: 'Você busca conforto na fé.', skillBonus: ['Ocultismo', 'Vontade'] },
    { name: 'Servidor Público', description: 'Você trabalha para a máquina estatal.', skillBonus: ['Atualidades', 'Intuição'] },
    { name: 'TI', description: 'Você é um gênio da computação.', skillBonus: ['Tecnologia', 'Investigação'] },
    { name: 'Trabalhador Rural', description: 'Você conhece a terra melhor que ninguém.', skillBonus: ['Adestramento', 'Sobrevivência'] },
    { name: 'Vítima', description: 'Você sobreviveu a algo terrível.', skillBonus: ['Reflexos', 'Vontade'] },
  ],
  classes: {
    Combatente: {
      baseHp: 20, hpPerLevel: 4, basePe: 2, pePerLevel: 2, baseSanity: 12, sanityPerLevel: 2,
      tracks: ['Aniquilador', 'Comandante', 'Guerreiro', 'Operações Especiais', 'Tropa de Choque'],
      initialAbilities: ['Ataque Especial'],
    },
    Especialista: {
      baseHp: 16, hpPerLevel: 3, basePe: 3, pePerLevel: 3, baseSanity: 16, sanityPerLevel: 3,
      tracks: ['Atirador de Elite', 'Infiltrado', 'Médico de Campo', 'Negociador', 'Técnico'],
      initialAbilities: ['Perito'],
    },
    Ocultista: {
      baseHp: 12, hpPerLevel: 2, basePe: 4, pePerLevel: 4, baseSanity: 20, sanityPerLevel: 4,
      tracks: ['Conduíte', 'Flagelador', 'Graduado', 'Lâmina Paranormal', 'Intuitivo'],
      initialAbilities: ['Escolhido pelo Outro Lado'],
    },
  },
  rituals: [
    { id: 'r1', name: 'Decadência', description: 'O alvo envelhece instantaneamente.', source: 'Ritual', circle: 1, element: 'Morte', execution: 'Padrão', range: 'Toque', target: '1 ser', duration: 'Instantânea', damage: '2d8 Morte', cost: 1, discenteDamage: '4d8 Morte', discenteExtraCost: 2 },
    { id: 'r2', name: 'Eletrocução', description: 'Arcos elétricos saltam das mãos.', source: 'Ritual', circle: 1, element: 'Energia', execution: 'Padrão', range: 'Curto', target: '1 ser', duration: 'Instantânea', damage: '3d6 Energia', cost: 1, discenteDamage: '6d6 Energia', discenteExtraCost: 2 },
    { id: 'r3', name: 'Arma Atroz', description: 'Sua arma brilha com uma aura vermelha.', source: 'Ritual', circle: 1, element: 'Sangue', execution: 'Padrão', range: 'Toque', target: '1 arma', duration: 'Cena', damage: '+1d6 Sangue', cost: 1, discenteDamage: '+2d6 Sangue', discenteExtraCost: 2 },
    { id: 'r4', name: 'Compreensão Marcada', description: 'Você entende qualquer língua.', source: 'Ritual', circle: 1, element: 'Conhecimento', execution: 'Padrão', range: 'Pessoal', target: 'Você', duration: 'Cena', cost: 1 },
    { id: 'r5', name: 'Chamas do Caos', description: 'Explosão de chamas.', source: 'Ritual', circle: 1, element: 'Energia', execution: 'Padrão', range: 'Médio', target: 'Área', duration: 'Instantânea', damage: '3d6 Fogo', cost: 1, discenteDamage: '6d6 Fogo', discenteExtraCost: 2 },
    { id: 'r6', name: 'Cicatrização', description: 'Acelera o metabolismo para curar.', source: 'Ritual', circle: 1, element: 'Sangue', execution: 'Padrão', range: 'Toque', target: '1 ser', duration: 'Instantânea', damage: '3d8 PV Corrigido', cost: 1, discenteDamage: '5d8 PV', discenteExtraCost: 2 }
  ],
  items: [
    { id: 'pistola', name: 'Pistola', space: 1, baseCategory: 1, category: 1, description: 'Arma de fogo leve.', isWeapon: true, damage: '1d12' },
    { id: 'faca', name: 'Faca', space: 1, baseCategory: 0, category: 0, description: 'Lâmina curta.', isWeapon: true, damage: '1d4' },
    { id: 'rifle_assalto', name: 'Rifle de Assalto', space: 2, baseCategory: 2, category: 2, description: 'Arma automática pesada.', isWeapon: true, damage: '2d10' },
    { id: 'espada', name: 'Espada', space: 1, baseCategory: 1, category: 1, description: 'Lâmina longa.', isWeapon: true, damage: '1d8' },
    { id: 'protecao_leve', name: 'Proteção Leve', space: 2, baseCategory: 1, category: 1, description: 'Colete balístico leve.', isArmor: true, defenseBonus: 5 },
    { id: 'protecao_pesada', name: 'Proteção Pesada', space: 3, baseCategory: 2, category: 2, description: 'Armadura pesada completa.', isArmor: true, defenseBonus: 10 }
  ],
  modifications: [
    { id: 'm1', name: 'Alvejante', categoryCost: 1, type: 'Arma', description: 'Aumenta margem de crítico.' },
    { id: 'm2', name: 'Certeira', categoryCost: 1, type: 'Arma', description: '+2 em testes de ataque.' },
    { id: 'm3', name: 'Cruel', categoryCost: 1, type: 'Arma', description: '+2 em testes de dano.' },
    { id: 'm4', name: 'Reforçada', categoryCost: 1, type: 'Armadura', description: '+2 na Defesa.' },
    { id: 'm5', name: 'Blindada', categoryCost: 1, type: 'Armadura', description: 'Aumenta RD.' }
  ],
  curses: [
    { id: 'c1', name: 'Sanguinária', categoryCost: 2, type: 'Arma', element: 'Sangue', description: 'Causa sangramento no alvo.' },
    { id: 'c2', name: 'Energética', categoryCost: 2, type: 'Arma', element: 'Energia', description: 'Dano ignora RD.' },
    { id: 'c3', name: 'Consumidora', categoryCost: 2, type: 'Arma', element: 'Morte', description: 'Drena PV do alvo.' }
  ],
  generalPowers: [
    { id: 'gp1', name: 'Atleta', description: '+2 em Atletismo e pode saltar mais longe.', source: 'Poder Geral' },
    { id: 'gp2', name: 'Casca Grossa', description: '+2 PV por nível.', source: 'Poder Geral' },
    { id: 'gp3', name: 'Mãos Rápidas', description: '+2 em Crime e Prestidigitação.', source: 'Poder Geral' }
  ],
  paranormalPowers: [
    { id: 'pp1', name: 'Sangue de Ferro', description: '+2 PV por nível (Sangue).', source: 'Poder Paranormal' },
    { id: 'pp2', name: 'Potencial Aprimorado', description: '+1 PE por nível (Energia).', source: 'Poder Paranormal' },
    { id: 'pp3', name: 'Visão do Águia', description: '+2 em Percepção (Morte).', source: 'Poder Paranormal' }
  ],
  trackAbilities: {
    Combatente: {
      'Aniquilador': [
        { id: 'an1', name: 'A Favorita', description: 'Escolha uma arma para reduzir categoria.', source: 'Trilha' },
        { id: 'an2', name: 'Técnica Letal', description: 'Aumenta multiplicador de crítico.', source: 'Trilha' }
      ],
      'Guerreiro': [
        { id: 'gu1', name: 'Técnica de Luta', description: 'Ganhe um poder de combate.', source: 'Trilha' },
        { id: 'gu2', name: 'Revanchismo', description: 'Contra-ataque após ser atingido.', source: 'Trilha' }
      ],
    },
    Especialista: {
      'Atirador de Elite': [
        { id: 'ae1', name: 'Foco em Pontaria', description: 'Reduz penalidades de distância.', source: 'Trilha' }
      ],
    },
    Ocultista: {
      'Conduíte': [
        { id: 'co1', name: 'Ampliar Ritual', description: 'Aumenta alcance dos rituais.', source: 'Trilha' }
      ],
    },
  }
};

export const SKILLS_LIST = [
  'Acrobacia', 'Adestramento', 'Artes', 'Atletismo', 'Atualidades', 'Ciências', 'Crime',
  'Diplomacia', 'Enganação', 'Fortitude', 'Furtividade', 'Iniciativa', 'Intimidação',
  'Intuição', 'Investigação', 'Luta', 'Medicina', 'Ocultismo', 'Percepção', 'Pilotagem',
  'Pontaria', 'Profissão', 'Reflexos', 'Religião', 'Sobrevivência', 'Tática', 'Tecnologia', 'Vontade'
];
