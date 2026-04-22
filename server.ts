import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';

const campaigns: Record<string, any> = {};

async function start() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  io.on('connection', (socket) => {
    socket.on('campaign:create', ({ name }) => {
      const id = Math.random().toString(36).substring(2, 7).toUpperCase();
      const campaign = { id, name, players: [], threats: [] };
      campaigns[id] = campaign;
      socket.join(id);
      socket.emit('campaign:created', campaign);
    });

    socket.on('campaign:join', (id) => {
      const campaign = campaigns[id];
      if (campaign) {
        socket.join(id);
        socket.emit('campaign:joined', campaign);
      } else {
        socket.emit('campaign:error', 'Código de mesa inválido ou mesa já encerrada!');
      }
    });

    // ATUALIZADO: Agora salva a ficha INTEIRA do jogador na mesa
    socket.on('character:sync', ({ campaignId, character }) => {
      const campaign = campaigns[campaignId];
      if (campaign) {
        const playerIndex = campaign.players.findIndex((p: any) => p.id === character.id);
        
        if (playerIndex >= 0) {
          campaign.players[playerIndex] = character;
        } else {
          campaign.players.push(character);
        }
        
        io.to(campaignId).emit('campaign:updated', campaign);
      }
    });

    socket.on('threat:sync', ({ campaignId, threat }) => {
      const campaign = campaigns[campaignId];
      if (campaign) {
        const tIndex = campaign.threats.findIndex((t: any) => t.id === threat.id);
        if (tIndex >= 0) {
          campaign.threats[tIndex] = threat;
        } else {
          campaign.threats.push(threat);
        }
        io.to(campaignId).emit('campaign:updated', campaign);
      }
    });

    socket.on('threat:delete', ({ campaignId, threatId }) => {
      const campaign = campaigns[campaignId];
      if (campaign) {
        campaign.threats = campaign.threats.filter((t: any) => t.id !== threatId);
        io.to(campaignId).emit('campaign:updated', campaign);
      }
    });
  });

  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
 const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
}

start();