import React, { useState } from 'react';
import { Users, Plus, Key, HelpCircle, Gamepad2, ArrowRight, BookOpen, Plane, Download } from 'lucide-react';
import { PLAYER_COLORS } from '../types/game';
import { WorldsDatabaseModal } from './WorldsDatabaseModal';
import { PWAInstallButton } from './PWAInstallButton';

interface RoomLobbyProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  onStartLocalMode: (playerCount?: number, startLevelIndex?: number) => void;
  isLoading: boolean;
  errorMessage: string | null;
  initialCode?: string;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartLocalMode,
  isLoading,
  errorMessage,
  initialCode = '',
}) => {
  const [tab, setTab] = useState<'offline' | 'create' | 'join'>('offline');
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('pico_name') || `Amigo ${Math.floor(Math.random() * 899 + 100)}`
  );
  const [roomCode, setRoomCode] = useState(initialCode.toUpperCase());
  const [offlineCount, setOfflineCount] = useState<number>(2);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showWorldsModal, setShowWorldsModal] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 14);
    setPlayerName(val);
    localStorage.setItem('pico_name', val);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-zinc-950 overflow-y-auto">
      {/* Background playful grid pattern & soft gradient blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-zinc-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        {/* Animated Cute Characters Header */}
        <div className="flex flex-col items-center mb-5">
          <div className="flex items-end justify-center gap-2 mb-2.5">
            {[0, 1, 2, 3].map((colorIdx, i) => {
              const c = PLAYER_COLORS[colorIdx];
              return (
                <div
                  key={colorIdx}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 border-black/30 shadow-md transform transition-transform ${
                    i === 1 ? '-translate-y-2' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-900" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-900" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-center">
            Pico Friends
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-medium mt-1 text-center">
            Campanha de 15 Mundos • Jogue Offline no Celular ou Online!
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Tabs: Modo Viagem Offline vs Criar Sala vs Entrar */}
        <div className="flex p-1 rounded-2xl bg-zinc-800/80 border border-white/5 mb-5 gap-1">
          <button
            type="button"
            onClick={() => setTab('offline')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'offline'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            Offline / Viagem
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'create'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Criar Online
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'join'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Código
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'offline' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Quantidade de Gatinhos (Escala):
                </span>
                <span className="text-xs font-extrabold text-amber-400">
                  {offlineCount} Jogadores
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setOfflineCount(num)}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                      offlineCount === num
                        ? 'bg-amber-400 text-zinc-950 shadow-md scale-105'
                        : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {num}P
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                No modo viagem offline você pode alternar entre <strong>Seguir (Bots Cooperativos)</strong>,{' '}
                <strong>Todos Juntos</strong>, <strong>Solo (1 por vez)</strong> e usar o botão{' '}
                <strong>Empilhar</strong> com 1 toque!
              </p>
            </div>

            <button
              type="button"
              onClick={() => onStartLocalMode(offlineCount)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-zinc-950 font-extrabold text-sm sm:text-base shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all"
            >
              <Gamepad2 className="w-5 h-5" />
              Jogar Offline Agora ({offlineCount} Gatinhos)
            </button>

            {/* PWA Install / Mobile Offline Link */}
            <PWAInstallButton />
          </div>
        ) : tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Seu Nome ou Apelido:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={handleNameChange}
                placeholder="Ex: Rapha"
                maxLength={14}
                className="w-full bg-zinc-800/80 border border-white/10 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !playerName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Users className="w-5 h-5" />
              {isLoading ? 'Criando sala...' : 'Criar Nova Sala Online'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Seu Nome ou Apelido:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={handleNameChange}
                placeholder="Ex: Rapha"
                maxLength={14}
                className="w-full bg-zinc-800/80 border border-white/10 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Código da Sala (4 Letras):
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Ex: ABCD"
                maxLength={6}
                className="w-full bg-zinc-800/80 border border-white/10 rounded-2xl px-4 py-3 text-center tracking-widest text-lg font-extrabold text-emerald-400 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !roomCode.trim() || !playerName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <ArrowRight className="w-5 h-5" />
              {isLoading ? 'Entrando...' : 'Entrar na Sala'}
            </button>
          </form>
        )}

        {/* How to play trigger, 15 Worlds database trigger & GitHub ZIP download */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-3 text-center">
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            Como Jogar
          </button>

          <span className="text-zinc-600">·</span>

          <button
            type="button"
            onClick={() => setShowWorldsModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            15 Mundos
          </button>

          <span className="text-zinc-600">·</span>

          <a
            href="/pico-friends-github.zip"
            download="pico-friends-github.zip"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar .ZIP (GitHub)
          </a>
        </div>
      </div>

      {/* 15 Worlds Encyclopedia Modal */}
      <WorldsDatabaseModal
        isOpen={showWorldsModal}
        onClose={() => setShowWorldsModal(false)}
        onSelectWorldLevel={(worldId) => {
          setShowWorldsModal(false);
          onStartLocalMode(offlineCount, worldId - 1);
        }}
      />

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-extrabold text-emerald-400 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" /> Regras & Controles Offline
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-white/5">
                <span className="font-bold text-amber-300">Modo Viagem Offline (2 a 8 Gatinhos):</span>
                <p className="text-zinc-400 text-xs mt-1">
                  • <strong>Seguir:</strong> Os outros gatinhos seguem você, pulam degraus e ajudam a empurrar caixas pesadas automaticamente!
                  <br />• <strong>Todos:</strong> Todos os gatinhos se movem e pulam juntos no seu controle.
                  <br />• <strong>Solo:</strong> Você controla 1 gatinho por vez (ótimo para deixar um amigo parado em cima de um botão!).
                  <br />• <strong>Botão Empilhar:</strong> Coloca instantaneamente um gatinho amigo no topo da sua cabeça para testar escadas humanas no celular!
                </p>
              </div>

              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-white/5">
                <span className="font-bold text-emerald-300">Empilhar & Empurrar Caixa:</span>
                <p className="text-zinc-400 text-xs mt-1">
                  Pule na cabeça dos amigos para alcançar chaves altas. Caixas pesadas escalam de peso conforme o número de jogadores (2P a 8P).
                </p>
              </div>

              <div className="bg-zinc-800/60 p-3 rounded-2xl border border-white/5">
                <span className="font-bold text-purple-300">Vitória:</span>
                <p className="text-zinc-400 text-xs mt-1">
                  A fase só é concluída quando <strong>TODOS</strong> os jogadores entram juntos no cofre da porta final!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all"
            >
              Entendi, vamos jogar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
