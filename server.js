const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { getRandomWord } = require('./lib/battle-words');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// In-memory room state
const rooms = {};    // 1v1 rooms
const battles = {};  // Battle Royale rooms (up to 4 players)

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calcPoints(attempts) {
  const table = { 1: 600, 2: 500, 3: 400, 4: 300, 5: 200, 6: 100 };
  return table[attempts] ?? 0;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('[socket] connected:', socket.id);

    // ════════════════════════════════════════════════════════════════
    // ── 1v1 MODE ────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════

    socket.on('create_room', ({ userName, totalRounds, lang }) => {
      const roomId = generateRoomCode();
      rooms[roomId] = {
        host: { id: socket.id, name: userName, score: 0 },
        guest: null,
        totalRounds,
        lang: lang || 'it',
        currentRound: 1,
        phase: 'waiting',
        words: {},
        guesses: {},
        currentGuess: {},
        roundScores: [],
      };
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName;
      socket.data.role = 'host';
      socket.data.mode = '1v1';
      socket.emit('room_created', { roomId });
      console.log('[1v1] room created:', roomId);
    });

    socket.on('join_room', ({ roomId, userName }) => {
      const room = rooms[roomId];
      if (!room) return socket.emit('error', { message: 'Stanza non trovata!' });
      if (room.guest) return socket.emit('error', { message: 'Stanza già piena!' });
      if (room.phase !== 'waiting') return socket.emit('error', { message: 'Partita già iniziata!' });

      room.guest = { id: socket.id, name: userName, score: 0 };
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName;
      socket.data.role = 'guest';
      socket.data.mode = '1v1';

      // Randomly assign who sets the word for this first round
      room.wordSetter = Math.random() < 0.5 ? room.host.id : socket.id;

      io.to(roomId).emit('player_joined', {
        host: room.host.name,
        guest: room.guest.name,
        totalRounds: room.totalRounds
      });

      room.phase = 'word_select';
      io.to(roomId).emit('phase_change', {
        phase: 'word_select',
        round: room.currentRound,
        wordSetterId: room.wordSetter
      });
    });

    socket.on('set_word', ({ word, isCustom }) => {
      const roomId = socket.data.roomId;
      const room = rooms[roomId];
      if (!room) return;
      // Only the designated word setter may submit
      if (socket.id !== room.wordSetter) return;

      const chosenWord = word.toUpperCase();
      const guesser = room.host.id === room.wordSetter ? room.guest : room.host;

      room.phase = 'playing';
      room.guesses[guesser.id] = [];
      room.currentGuess[guesser.id] = '';
      room.currentWord = chosenWord;

      // Guesser gets the word to guess
      io.to(guesser.id).emit('game_start', {
        yourWord: chosenWord,
        opponentName: socket.data.userName,
      });

      // Setter switches to spectator view
      socket.emit('setter_start', {
        guesserName: guesser.name,
        isCustom: !!isCustom,
      });

      console.log(`[1v1] round ${room.currentRound} started — word: ${chosenWord} | setter: ${socket.data.userName} | guesser: ${guesser.name}`);
    });

    socket.on('typing', ({ currentGuess }) => {
      const roomId = socket.data.roomId;
      const room = rooms[roomId];
      if (!room) return;
      room.currentGuess[socket.id] = currentGuess;
      socket.to(roomId).emit('opponent_typing', { currentGuess });
    });

    socket.on('submit_guess', ({ guess }) => {
      const roomId = socket.data.roomId;
      const room = rooms[roomId];
      if (!room || room.phase !== 'playing') return;

      if (!room.guesses[socket.id]) room.guesses[socket.id] = [];
      room.guesses[socket.id].push(guess.toUpperCase());
      room.currentGuess[socket.id] = '';

      socket.to(roomId).emit('opponent_guess', {
        guesses: room.guesses[socket.id]
      });
    });

    // Client calls this when the game room page mounts — catches up if phase_change was missed
    socket.on('request_room_state', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      
      const opponentId = room.host?.id === socket.id ? room.guest?.id : room.host?.id;
      
      socket.emit('room_state', {
        phase: room.phase,
        round: room.currentRound,
        totalRounds: room.totalRounds,
        lang: room.lang || 'it',
        wordSetterId: room.wordSetter ?? null,
        hostName: room.host?.name,
        guestName: room.guest?.name,
        hostScore: room.host?.score ?? 0,
        guestScore: room.guest?.score ?? 0,
        myGuesses: room.guesses[socket.id] || [],
        myCurrentGuess: room.currentGuess[socket.id] || '',
        oppGuesses: opponentId ? (room.guesses[opponentId] || []) : [],
        oppCurrentGuess: opponentId ? (room.currentGuess[opponentId] || '') : '',
      });
    });

    socket.on('round_finish', ({ attempts, won }) => {
      const roomId = socket.data.roomId;
      const room = rooms[roomId];
      if (!room) return;

      // Only the guesser can finish a round
      const guesserPoints = won ? calcPoints(attempts) : 0;
      // Setter gets bonus points if guesser failed (stumped them)
      const setterPoints = won ? 0 : 200;

      if (socket.id === room.host.id) {
        room.host.score += guesserPoints;
        room.guest.score += setterPoints;  // guest was setter
      } else {
        room.guest.score += guesserPoints;
        room.host.score += setterPoints;   // host was setter
      }

      io.to(roomId).emit('round_end', {
        round: room.currentRound,
        hostScore: room.host.score,
        guestScore: room.guest.score,
        hostName: room.host.name,
        guestName: room.guest.name,
        guesserWon: won,
        attempts,
      });

      if (room.currentRound >= room.totalRounds) {
        room.phase = 'game_end';
        const winner = room.host.score > room.guest.score
          ? room.host
          : room.guest.score > room.host.score
            ? room.guest
            : null;

        io.to(roomId).emit('game_end', {
          hostScore: room.host.score,
          guestScore: room.guest.score,
          hostName: room.host.name,
          guestName: room.guest.name,
          winnerId: winner?.id ?? null,
          winnerName: winner?.name ?? null
        });
      } else {
        room.currentRound++;
        room.phase = 'word_select';
        room.guesses = {};
        room.currentGuess = {};
        room.currentWord = null;
        // Swap setter for next round (randomly)
        room.wordSetter = room.wordSetter === room.host.id ? room.guest.id : room.host.id;
        setTimeout(() => {
          io.to(roomId).emit('phase_change', {
            phase: 'word_select',
            round: room.currentRound,
            wordSetterId: room.wordSetter
          });
        }, 3000);
      }
    });

    socket.on('vote_quit', () => {
      const roomId = socket.data.roomId;
      const userName = socket.data.userName || socket.id; // fallback to ID
      const mode = socket.data.mode;
      if (!roomId) return;

      if (mode === 'multiplayer') {
         const room = rooms[roomId];
         if (!room) return;
         if (!room.quitVotes) room.quitVotes = {};
         room.quitVotes[userName] = true;
         
         const totalPlayers = (room.host ? 1 : 0) + (room.guest ? 1 : 0);
         const voteCount = Object.keys(room.quitVotes).length;
         
         io.to(roomId).emit('quit_vote_update', { votes: voteCount, total: totalPlayers });
         
         if (voteCount >= totalPlayers && totalPlayers > 0) {
           io.to(roomId).emit('force_disconnect_room');
           delete rooms[roomId];
         }
      } else if (mode === 'battle') {
         const battle = battles[roomId];
         if (!battle) return;
         if (!battle.quitVotes) battle.quitVotes = {};
         battle.quitVotes[userName] = true;
         
         const totalPlayers = battle.players.length;
         const voteCount = Object.keys(battle.quitVotes).length;
         
         io.to(roomId).emit('quit_vote_update', { votes: voteCount, total: totalPlayers });
         
         if (voteCount >= totalPlayers && totalPlayers > 0) {
           io.to(roomId).emit('force_disconnect_room');
           delete battles[roomId];
         }
      }
    });

    // ════════════════════════════════════════════════════════════════
    // ── BATTLE ROYALE MODE ──────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════

    socket.on('create_battle', ({ userName, totalRounds, lang }) => {
      const roomId = 'BR' + generateRoomCode();
      battles[roomId] = {
        host: socket.id,
        players: [{ id: socket.id, name: userName, score: 0 }],
        totalRounds,
        lang: lang || 'it',
        currentRound: 0,
        phase: 'lobby',  // lobby | playing | round_end | game_end
        currentWord: null,
        roundFinished: {},  // { socketId: true }
        roundScores: {},    // { socketId: points this round }
      };
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName;
      socket.data.mode = 'battle';
      socket.emit('battle_created', { roomId });
      console.log('[battle] created:', roomId);
    });

    socket.on('join_battle', ({ roomId, userName }) => {
      const battle = battles[roomId];
      if (!battle) return socket.emit('error', { message: 'Stanza non trovata!' });
      if (battle.players.length >= 4) return socket.emit('error', { message: 'Stanza piena! (max 4 giocatori)' });
      if (battle.phase !== 'lobby') {
        // Allow reconnection if the player was already in the room
        const existingPlayer = battle.players.find(p => p.name === userName);
        if (existingPlayer) {
           existingPlayer.id = socket.id; // Update socket ID
           socket.join(roomId);
           socket.data.roomId = roomId;
           socket.data.userName = userName;
           socket.data.mode = 'battle';
           socket.emit('battle_player_joined', {
             roomId,
             players: battle.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
             totalRounds: battle.totalRounds,
             lang: battle.lang,
             hostId: battle.host,
           });
           return;
        }
        return socket.emit('error', { message: 'Partita già iniziata!' });
      }

      battle.players.push({ id: socket.id, name: userName, score: 0 });
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName;
      socket.data.mode = 'battle';

      io.to(roomId).emit('battle_player_joined', {
        roomId,
        players: battle.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        totalRounds: battle.totalRounds,
        lang: battle.lang,
        hostId: battle.host,
      });
      console.log('[battle] player joined:', roomId, userName);
    });

    // Host kicks off the round
    socket.on('start_battle', () => {
      const roomId = socket.data.roomId;
      const battle = battles[roomId];
      if (!battle || socket.id !== battle.host) return;
      if (battle.players.length < 2) return socket.emit('error', { message: 'Servono almeno 2 giocatori!' });

      startBattleRound(io, roomId, battle);
    });

    // Client calls this when the battle room page mounts — catches up if battle_round_start was missed
    socket.on('request_battle_state', ({ roomId }) => {
      const battle = battles[roomId];
      if (!battle) return;
      socket.emit('battle_state', {
        phase: battle.phase,
        round: battle.currentRound,
        totalRounds: battle.totalRounds,
        lang: battle.lang,
        word: battle.currentWord,
        players: battle.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        myGuesses: battle.guesses ? (battle.guesses[socket.id] || []) : [],
        myCurrentGuess: battle.currentGuess ? (battle.currentGuess[socket.id] || '') : '',
        opponentBoards: battle.guesses || {},
        opponentTyping: battle.currentGuess || {},
        roundFinished: battle.roundFinished ? !!battle.roundFinished[socket.id] : false,
      });
    });

    socket.on('battle_typing', ({ currentGuess }) => {
      const roomId = socket.data.roomId;
      socket.to(roomId).emit('battle_opponent_typing', { playerId: socket.id, currentGuess });
    });

    socket.on('battle_submit_guess', ({ guess }) => {
      const roomId = socket.data.roomId;
      const battle = battles[roomId];
      if (!battle) return;
      socket.to(roomId).emit('battle_opponent_guess', { playerId: socket.id, guess: guess.toUpperCase() });
    });

    socket.on('battle_round_finish', ({ attempts, won }) => {
      const roomId = socket.data.roomId;
      const battle = battles[roomId];
      if (!battle || battle.phase !== 'playing') return;

      const points = won ? calcPoints(attempts) : 0;
      battle.roundScores[socket.id] = points;
      battle.roundFinished[socket.id] = true;

      // Update player total score
      const player = battle.players.find(p => p.id === socket.id);
      if (player) player.score += points;

      // Check if all players have finished
      const allDone = battle.players.every(p => battle.roundFinished[p.id]);
      if (!allDone) {
        // Tell room someone finished
        io.to(roomId).emit('battle_player_finished', {
          playerId: socket.id,
          playerName: socket.data.userName,
          points,
        });
        return;
      }

      // All finished — end the round
      battle.phase = 'round_end';
      const scores = battle.players.map(p => ({
        id: p.id,
        name: p.name,
        roundPoints: battle.roundScores[p.id] ?? 0,
        totalScore: p.score,
      }));

      io.to(roomId).emit('battle_round_end', {
        round: battle.currentRound,
        scores,
        totalRounds: battle.totalRounds,
      });

      if (battle.currentRound >= battle.totalRounds) {
        // Final
        battle.phase = 'game_end';
        const sorted = [...battle.players].sort((a, b) => b.score - a.score);
        const winner = sorted[0].score > (sorted[1]?.score ?? -1) ? sorted[0] : null;

        io.to(roomId).emit('battle_game_end', {
          scores,
          winnerId: winner?.id ?? null,
          winnerName: winner?.name ?? null,
          winnerScore: winner?.score ?? 0,
        });
      } else {
        // Next round after delay
        setTimeout(() => {
          startBattleRound(io, roomId, battle);
        }, 4000);
      }
    });

    // ── DISCONNECT ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      const mode = socket.data.mode;

      if (mode === '1v1' && roomId && rooms[roomId]) {
        const room = rooms[roomId];
        if (socket.id === room.host.id) {
          // Host left — kill the room entirely
          socket.to(roomId).emit('opponent_disconnected');
          delete rooms[roomId];
        } else if (socket.id === room.guest?.id && room.phase === 'waiting') {
          // Guest left before game started — clear slot so a new player can join
          room.guest = null;
          socket.to(roomId).emit('guest_left');
        } else {
          // Mid-game disconnect
          socket.to(roomId).emit('opponent_disconnected');
          delete rooms[roomId];
        }
      }
      if (mode === 'battle' && roomId && battles[roomId]) {
        const battle = battles[roomId];
        battle.players = battle.players.filter(p => p.id !== socket.id);
        if (battle.players.length === 0) {
          delete battles[roomId];
        } else {
          // Notify remaining players
          io.to(roomId).emit('battle_player_left', {
            playerId: socket.id,
            players: battle.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
          });
          // Transfer host if needed
          if (battle.host === socket.id) {
            battle.host = battle.players[0].id;
            io.to(roomId).emit('battle_new_host', { hostId: battle.host });
          }
        }
      }
      console.log('[socket] disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

// ── Helper: start a battle round ─────────────────────────────────────────────
function startBattleRound(io, roomId, battle) {
  battle.currentRound++;
  battle.phase = 'playing';
  battle.roundFinished = {};
  battle.roundScores = {};
  battle.currentWord = getRandomWord(battle.lang);

  io.to(roomId).emit('battle_round_start', {
    round: battle.currentRound,
    totalRounds: battle.totalRounds,
    word: battle.currentWord,
    lang: battle.lang,
  });
  console.log(`[battle] round ${battle.currentRound} started — word: ${battle.currentWord}`);
}
