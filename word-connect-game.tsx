'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Trophy,
  Zap,
  Settings,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface WordPair {
  id: number;
  chinese: string;
  english: string;
  matched: boolean;
  groupId: number; // 所属分组ID
}

interface WordGroup {
  id: number;
  name: string; // 分组名称，如"第1课"、"第2课"等
}

interface Player {
  id: 1 | 2;
  name: string;
  score: number;
  gameWords: Array<{
    id: string;
    word: string;
    type: 'chinese' | 'english';
    pairId: number;
    matched: boolean;
    isWrong?: boolean;
  }>;
  selectedCards: string[];
  eliminatingCards: string[];
  completed: boolean;
  completionTime?: number;
}

const defaultWordGroups: WordGroup[] = [
  { id: 1, name: 'Unit 5' },
  { id: 2, name: 'Unit 6' },
  { id: 3, name: 'Unit 7' },
];

const defaultWordPairs: WordPair[] = [
  // Unit 5
  { id: 1, chinese: '邀请', english: 'invite', matched: false, groupId: 1 },
  {
    id: 2,
    chinese: '失望的',
    english: 'disappointed',
    matched: false,
    groupId: 1,
  },
  { id: 3, chinese: '电影', english: 'film', matched: false, groupId: 1 },
  { id: 4, chinese: '闻到', english: 'smell', matched: false, groupId: 1 },
  { id: 5, chinese: '似乎', english: 'seem', matched: false, groupId: 1 },
  { id: 6, chinese: '歌剧', english: 'opera', matched: false, groupId: 1 },
  { id: 7, chinese: '使激动', english: 'excite', matched: false, groupId: 1 },
  { id: 8, chinese: '照顾', english: 'care for', matched: false, groupId: 1 },

  // Unit 6
  { id: 9, chinese: '考试', english: 'exam', matched: false, groupId: 2 },
  { id: 10, chinese: '严格的', english: 'strict', matched: false, groupId: 2 },
  { id: 11, chinese: '害羞的', english: 'shy', matched: false, groupId: 2 },
  {
    id: 12,
    chinese: '别紧张',
    english: 'take it easy',
    matched: false,
    groupId: 2,
  },
  { id: 13, chinese: '不及格', english: 'fail', matched: false, groupId: 2 },
  { id: 14, chinese: '某人', english: 'someone', matched: false, groupId: 2 },
  { id: 15, chinese: '感觉', english: 'feeling', matched: false, groupId: 2 },
  { id: 16, chinese: '笑话', english: 'joke', matched: false, groupId: 2 },

  // Unit 7
  {
    id: 17,
    chinese: '顺便提一下',
    english: 'by the way',
    matched: false,
    groupId: 3,
  },
  { id: 18, chinese: '是的', english: 'yeah', matched: false, groupId: 3 },
  { id: 19, chinese: '通常的', english: 'usual', matched: false, groupId: 3 },
  { id: 20, chinese: '也', english: 'either', matched: false, groupId: 3 },
  { id: 21, chinese: '接受', english: 'accept', matched: false, groupId: 3 },
  { id: 22, chinese: '可爱的', english: 'lovely', matched: false, groupId: 3 },
  { id: 23, chinese: '有用的', english: 'helpful', matched: false, groupId: 3 },
  {
    id: 24,
    chinese: '国际的',
    english: 'international',
    matched: false,
    groupId: 3,
  },
];

export default function Component() {
  const [allWordPairs, setAllWordPairs] =
    useState<WordPair[]>(defaultWordPairs);
  const [allWordGroups, setAllWordGroups] =
    useState<WordGroup[]>(defaultWordGroups);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingWords, setEditingWords] = useState<WordPair[]>([]);
  const [editingGroups, setEditingGroups] = useState<WordGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0); // 设置界面中选择的分组ID
  const [gameGroupId, setGameGroupId] = useState<number>(1); // 游戏中选择的分组ID // 0表示全部分组
  const [pairsPerPlayer, setPairsPerPlayer] = useState(6); // 每个玩家的配对单词数量
  const [batchInput, setBatchInput] = useState(''); // 批量输入的文本

  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      name: '玩家1',
      score: 0,
      gameWords: [],
      selectedCards: [],
      eliminatingCards: [],
      completed: false,
    },
    {
      id: 2,
      name: '玩家2',
      score: 0,
      gameWords: [],
      selectedCards: [],
      eliminatingCards: [],
      completed: false,
    },
  ]);

  const [gameState, setGameState] = useState<
    'waiting' | 'playing' | 'finished'
  >('waiting');
  const [gameTime, setGameTime] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 从localStorage加载游戏设置
  useEffect(() => {
    // 加载自定义单词
    const savedWords = localStorage.getItem('customWordPairs');
    if (savedWords) {
      try {
        const parsedWords = JSON.parse(savedWords);
        if (Array.isArray(parsedWords) && parsedWords.length > 0) {
          setAllWordPairs(
            parsedWords.map((item) => ({ ...item, groupId: item.groupId || 1 }))
          );
        }
      } catch (error) {
        console.error('Failed to load custom words:', error);
      }
    }

    // 加载自定义分组
    const savedGroups = localStorage.getItem('customWordGroups');
    if (savedGroups) {
      try {
        const parsedGroups = JSON.parse(savedGroups);
        if (Array.isArray(parsedGroups) && parsedGroups.length > 0) {
          setAllWordGroups(parsedGroups);
        }
      } catch (error) {
        console.error('Failed to load custom groups:', error);
      }
    }

    // 加载配对单词数量设置
    const savedPairsPerPlayer = localStorage.getItem('pairsPerPlayer');
    if (savedPairsPerPlayer) {
      try {
        const parsedValue = parseInt(savedPairsPerPlayer);
        if (!isNaN(parsedValue) && parsedValue >= 3 && parsedValue <= 12) {
          setPairsPerPlayer(parsedValue);
        }
      } catch (error) {
        console.error('Failed to load pairs per player setting:', error);
      }
    }

    // 加载选择的游戏分组ID
    const savedGameGroupId = localStorage.getItem('gameGroupId');
    if (savedGameGroupId) {
      try {
        const parsedValue = parseInt(savedGameGroupId);
        if (!isNaN(parsedValue)) {
          setGameGroupId(parsedValue);
        }
      } catch (error) {
        console.error('Failed to load game group ID setting:', error);
      }
    }

    initializeGame();
  }, []);

  // 保存游戏设置到localStorage
  const saveGameSettings = () => {
    // 保存自定义单词
    localStorage.setItem('customWordPairs', JSON.stringify(editingWords));
    setAllWordPairs(editingWords);

    // 保存自定义分组
    localStorage.setItem('customWordGroups', JSON.stringify(editingGroups));
    setAllWordGroups(editingGroups);

    // 保存配对单词数量
    localStorage.setItem('pairsPerPlayer', pairsPerPlayer.toString());

    // 保存选择的游戏分组ID
    localStorage.setItem('gameGroupId', JSON.stringify(gameGroupId));
    setGameGroupId(gameGroupId);

    setIsSettingsOpen(false);
    // 重新初始化游戏
    initializeGame();
  };

  // 打开设置对话框
  const openSettings = () => {
    setEditingWords([...allWordPairs]);
    setEditingGroups([...allWordGroups]);
    setSelectedGroupId(0); // 默认显示全部分组
    setIsSettingsOpen(true);
  };

  // 批量添加单词对
  const addBatchWordPairs = () => {
    if (!batchInput.trim() || selectedGroupId === 0) {
      toast.error('请选择分组并输入单词对');
      return;
    }

    const lines = batchInput
      .trim()
      .split('\n')
      .filter((line) => line.trim());
    const newPairs: WordPair[] = [];
    let currentMaxId = Math.max(...editingWords.map((w) => w.id), 0);
    let successCount = 0;
    let errorCount = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // 按空格分割，取第一个作为英文，剩余的作为中文
      const parts = trimmedLine.split(' ');
      if (parts.length < 2) {
        errorCount++;
        return;
      }

      const english = parts[0].trim();
      const chinese = parts.slice(1).join(' ').trim();

      if (english && chinese) {
        currentMaxId++;
        newPairs.push({
          id: currentMaxId,
          english,
          chinese,
          matched: false,
          groupId: selectedGroupId,
        });
        successCount++;
      } else {
        errorCount++;
      }
    });

    if (newPairs.length > 0) {
      setEditingWords([...editingWords, ...newPairs]);
      setBatchInput('');
      toast.success(
        `成功添加 ${successCount} 对单词${
          errorCount > 0 ? `，${errorCount} 行格式错误已跳过` : ''
        }`
      );
    } else {
      toast.error('没有有效的单词对，请检查格式');
    }
  };

  // 添加新分组
  const addWordGroup = () => {
    if (newGroupName.trim()) {
      const newId = Math.max(...editingGroups.map((g) => g.id), 0) + 1;
      const newGroup: WordGroup = {
        id: newId,
        name: newGroupName.trim(),
      };
      setEditingGroups([...editingGroups, newGroup]);
      setNewGroupName('');
      // 自动选择新创建的分组
      setSelectedGroupId(newId);
    }
  };

  // 删除分组
  const deleteWordGroup = (id: number) => {
    // 删除分组前确认
    const groupHasWords = editingWords.some((word) => word.groupId === id);
    if (groupHasWords) {
      if (!confirm('删除此分组将同时删除该分组下的所有单词，确定要删除吗？')) {
        return;
      }
      // 删除该分组下的所有单词
      setEditingWords(editingWords.filter((word) => word.groupId !== id));
    }

    // 删除分组
    setEditingGroups(editingGroups.filter((group) => group.id !== id));

    // 如果删除的是当前选中的分组，则重置为显示全部
    if (selectedGroupId === id) {
      setSelectedGroupId(0);
    }
  };

  // 编辑分组名称
  const updateWordGroup = (id: number, name: string) => {
    setEditingGroups(
      editingGroups.map((group) =>
        group.id === id ? { ...group, name } : group
      )
    );
  };

  // 删除单词对
  const deleteWordPair = (id: number) => {
    setEditingWords(editingWords.filter((w) => w.id !== id));
  };

  // 编辑单词对
  const updateWordPair = (
    id: number,
    field: 'chinese' | 'english',
    value: string
  ) => {
    setEditingWords(
      editingWords.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  // 重置为默认单词和分组
  const resetToDefault = () => {
    setEditingWords([...defaultWordPairs]);
    setEditingGroups([...defaultWordGroups]);
    setSelectedGroupId(0); // 重置为显示全部分组
  };

  // 游戏计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // 初始化游戏
  const initializeGame = useCallback(() => {
    // 根据选择的分组筛选单词对
    const filteredPairs =
      gameGroupId === 0
        ? [...allWordPairs] // 如果选择全部分组，则使用所有单词对
        : allWordPairs.filter((pair) => pair.groupId === gameGroupId); // 否则只使用选定分组的单词对

    if (filteredPairs.length < pairsPerPlayer) {
      toast(
        `当前选择的分组中单词对数量不足${pairsPerPlayer}对，请添加更多单词或选择其他分组！`
      );
      return;
    }

    // 为每个玩家分配单词对
    const shuffledPairs = [...filteredPairs].sort(() => Math.random() - 0.5);
    const player1Pairs = shuffledPairs.slice(0, pairsPerPlayer);
    const player2Pairs = [...filteredPairs]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairsPerPlayer);

    const createPlayerWords = (pairs: WordPair[], playerId: number) => {
      const words: any[] = [];
      pairs.forEach((pair) => {
        words.push({
          id: `p${playerId}-chinese-${pair.id}`,
          word: pair.chinese,
          type: 'chinese' as const,
          pairId: pair.id,
          matched: false,
          isWrong: false,
        });
        words.push({
          id: `p${playerId}-english-${pair.id}`,
          word: pair.english,
          type: 'english' as const,
          pairId: pair.id,
          matched: false,
          isWrong: false,
        });
      });
      return words.sort(() => Math.random() - 0.5);
    };

    setPlayers([
      {
        id: 1,
        name: '玩家1',
        score: 0,
        gameWords: createPlayerWords(player1Pairs, 1),
        selectedCards: [],
        eliminatingCards: [],
        completed: false,
      },
      {
        id: 2,
        name: '玩家2',
        score: 0,
        gameWords: createPlayerWords(player2Pairs, 2),
        selectedCards: [],
        eliminatingCards: [],
        completed: false,
      },
    ]);

    setGameState('waiting');
    setGameTime(0);
    setWinner(null);
  }, [allWordPairs, pairsPerPlayer, gameGroupId]);

  useEffect(() => {
    if (isSettingsOpen) return;
    initializeGame();
  }, [initializeGame]);

  // 开始游戏
  const startGame = () => {
    setGameState('playing');
    setGameTime(0);
  };

  // 发音功能
  const speakWord = (word: string, type: 'chinese' | 'english') => {
    if (!soundEnabled || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(word);
    if (type === 'chinese') {
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
    }
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // 创建消除特效
  const createEliminationEffect = (cardId: string) => {
    const cardElement = document.getElementById(cardId);
    if (!cardElement) return;

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: ${Math.random() > 0.5 ? '#3b82f6' : '#8b5cf6'};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: particle-explosion 0.6s ease-out forwards;
      `;

      const rect = cardElement.getBoundingClientRect();
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;

      const angle = (i / 8) * Math.PI * 2;
      const velocity = 80 + Math.random() * 40;
      particle.style.setProperty('--dx', `${Math.cos(angle) * velocity}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * velocity}px`);

      document.body.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 600);
    }
  };

  // 创建获胜特效
  const createWinnerEffect = () => {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.cssText = `
          position: fixed;
          width: 4px;
          height: 4px;
          background: ${
            ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][
              Math.floor(Math.random() * 6)
            ]
          };
          border-radius: 50%;
          pointer-events: none;
          z-index: 2000;
          left: ${Math.random() * window.innerWidth}px;
          top: ${Math.random() * window.innerHeight}px;
          animation: firework-explosion 2s ease-out forwards;
        `;

        document.body.appendChild(firework);

        setTimeout(() => {
          if (firework.parentNode) {
            firework.parentNode.removeChild(firework);
          }
        }, 2000);
      }, i * 50);
    }
  };

  // 处理卡片点击
  const handleCardClick = (playerId: 1 | 2, cardId: string) => {
    if (gameState !== 'playing') return;

    const player = players.find((p) => p.id === playerId);
    if (!player || player.completed) return;

    const card = player.gameWords.find((w) => w.id === cardId);
    if (
      !card ||
      card.matched ||
      player.selectedCards.includes(cardId) ||
      player.eliminatingCards.includes(cardId)
    ) {
      return;
    }

    if (card.type === 'english') {
      speakWord(card.word, card.type);
    }

    const newSelectedCards = [...player.selectedCards, cardId];

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, selectedCards: newSelectedCards } : p
      )
    );

    if (newSelectedCards.length === 2) {
      const [firstCardId, secondCardId] = newSelectedCards;
      const firstCard = player.gameWords.find((w) => w.id === firstCardId);
      const secondCard = player.gameWords.find((w) => w.id === secondCardId);

      if (
        firstCard &&
        secondCard &&
        firstCard.pairId === secondCard.pairId &&
        firstCard.type !== secondCard.type
      ) {
        // 匹配成功
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId
              ? { ...p, eliminatingCards: [firstCardId, secondCardId] }
              : p
          )
        );

        setTimeout(() => {
          createEliminationEffect(firstCardId);
          createEliminationEffect(secondCardId);
        }, 100);

        setTimeout(() => {
          setPlayers((prev) =>
            prev.map((p) => {
              if (p.id === playerId) {
                const newGameWords = p.gameWords.filter(
                  (w) => w.id !== firstCardId && w.id !== secondCardId
                );
                const newScore = p.score + 1;
                const completed = newGameWords.length === 0;

                if (completed && !winner) {
                  const completionTime = gameTime;
                  setWinner({
                    ...p,
                    score: newScore,
                    completed: true,
                    completionTime,
                  });
                  setGameState('finished');
                  createWinnerEffect();

                  if (soundEnabled) {
                    const winSound = new SpeechSynthesisUtterance(
                      `${p.name}获胜！`
                    );
                    winSound.lang = 'zh-CN';
                    winSound.rate = 0.8;
                    window.speechSynthesis.speak(winSound);
                  }
                }

                return {
                  ...p,
                  gameWords: newGameWords,
                  score: newScore,
                  selectedCards: [],
                  eliminatingCards: [],
                  completed,
                  completionTime: completed ? gameTime : undefined,
                };
              }
              return p;
            })
          );
        }, 600);
      } else {
        // 匹配失败
        const wrongCards = [firstCardId, secondCardId];

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  gameWords: p.gameWords.map((word) =>
                    wrongCards.includes(word.id)
                      ? { ...word, isWrong: true }
                      : word
                  ),
                }
              : p
          )
        );

        setTimeout(() => {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === playerId
                ? {
                    ...p,
                    gameWords: p.gameWords.map((word) => ({
                      ...word,
                      isWrong: false,
                    })),
                    selectedCards: [],
                  }
                : p
            )
          );
        }, 1000);
      }
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style jsx global>{`
        @keyframes particle-explosion {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx), var(--dy)) scale(0);
            opacity: 0;
          }
        }

        @keyframes firework-explosion {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes elimination-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(0.9);
          }
        }

        @keyframes rainbow-border {
          0% {
            border-color: #3b82f6;
          }
          25% {
            border-color: #8b5cf6;
          }
          50% {
            border-color: #ec4899;
          }
          75% {
            border-color: #f59e0b;
          }
          100% {
            border-color: #10b981;
          }
        }

        .eliminating {
          animation: elimination-pulse 0.6s ease-in-out,
            rainbow-border 0.6s ease-in-out;
          border-width: 3px !important;
        }

        @keyframes shake-error {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-6px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(6px);
          }
        }

        @keyframes error-flash {
          0%,
          100% {
            background-color: transparent;
          }
          50% {
            background-color: rgba(239, 68, 68, 0.3);
          }
        }

        .error-card {
          animation: shake-error 0.6s ease-in-out, error-flash 0.6s ease-in-out;
          border-color: #ef4444 !important;
          border-width: 2px !important;
        }

        @keyframes winner-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
          }
        }

        .winner-area {
          animation: winner-glow 2s ease-in-out infinite;
          border: 3px solid #ffd700;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* 游戏标题和控制区 */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              双人单词消消乐
            </h1>
            <p className="text-gray-600 mb-4">两人比拼，看谁先完成所有配对！</p>
            {/* 显示当前选择的分组 */}
            <p className="text-blue-600 font-medium mb-2">
              当前分组:{' '}
              {gameGroupId === 0
                ? '全部分组'
                : allWordGroups.find((g) => g.id === gameGroupId)?.name ||
                  '未选择'}
            </p>

            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(gameTime)}
              </div>

              {/* 设置按钮 */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openSettings} variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    游戏设置
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-4xl max-h-[80vh] overflow-y-auto"
                  onPointerDownOutside={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle>游戏设置</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* 游戏配置 */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="text-lg font-semibold mb-3">游戏配置</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="pairsPerPlayer">
                            每位玩家的配对单词数量
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="pairsPerPlayer"
                              type="number"
                              min="3"
                              max="12"
                              value={pairsPerPlayer}
                              onChange={(e) =>
                                setPairsPerPlayer(
                                  Math.max(
                                    3,
                                    Math.min(12, parseInt(e.target.value) || 6)
                                  )
                                )
                              }
                            />
                            <span className="text-sm text-gray-500 text-nowrap">
                              对 (3-12)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 课程分组管理 */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="text-lg font-semibold mb-3">
                        课程分组管理
                      </h3>

                      {/* 添加新分组 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="newGroupName">新分组名称</Label>
                          <Input
                            id="newGroupName"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="输入分组名称，如：第1课"
                            onKeyPress={(e) =>
                              e.key === 'Enter' && addWordGroup()
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={addWordGroup} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            添加分组
                          </Button>
                        </div>
                      </div>

                      {/* 分组列表 */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {editingGroups.map((group) => (
                          <div
                            key={group.id}
                            className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-white"
                          >
                            <div className="md:col-span-2">
                              <Input
                                value={group.name}
                                onChange={(e) =>
                                  updateWordGroup(group.id, e.target.value)
                                }
                                placeholder="分组名称"
                              />
                            </div>
                            <Button
                              onClick={() => deleteWordGroup(group.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 添加新单词 */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="text-lg font-semibold mb-3">
                        添加新单词对
                      </h3>

                      {/* 选择分组 */}
                      <div className="mb-4">
                        <Label htmlFor="selectedGroup">选择课程分组</Label>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <select
                            id="selectedGroup"
                            className="w-full p-2 border rounded-md"
                            value={selectedGroupId}
                            onChange={(e) =>
                              setSelectedGroupId(parseInt(e.target.value))
                            }
                          >
                            <option value={0}>-- 请选择分组 --</option>
                            {editingGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="batchInput">批量添加单词对</Label>
                          <Textarea
                            id="batchInput"
                            value={batchInput}
                            onChange={(e) => setBatchInput(e.target.value)}
                            placeholder={`每行一个单词对，格式：英文 中文，例如：
hello 你好
world 世界
invite 邀请`}
                            disabled={selectedGroupId === 0}
                            rows={8}
                            className="resize-none"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={addBatchWordPairs}
                            disabled={
                              selectedGroupId === 0 || !batchInput.trim()
                            }
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            批量添加
                          </Button>
                        </div>
                      </div>
                      {selectedGroupId === 0 && (
                        <p className="text-sm text-amber-600 mt-2">
                          请先选择一个分组，然后再添加单词
                        </p>
                      )}
                    </div>

                    {/* 单词列表 */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">
                            单词列表 ({editingWords.length}对)
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              (需要至少 {pairsPerPlayer} 对)
                            </span>
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <select
                            className="p-2 border rounded-md text-sm"
                            value={selectedGroupId}
                            onChange={(e) =>
                              setSelectedGroupId(parseInt(e.target.value))
                            }
                          >
                            <option value={0}>显示全部分组</option>
                            {editingGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            onClick={resetToDefault}
                            variant="outline"
                            size="sm"
                          >
                            恢复默认
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {/* 按分组显示单词 */}
                        {selectedGroupId === 0 ? (
                          // 显示所有分组
                          editingGroups.map((group) => {
                            const groupWords = editingWords.filter(
                              (word) => word.groupId === group.id
                            );
                            if (groupWords.length === 0) return null;

                            return (
                              <div key={group.id} className="mb-4">
                                <h4 className="font-medium text-blue-600 mb-2 border-b pb-1">
                                  {group.name} ({groupWords.length}对)
                                </h4>
                                <div className="space-y-2">
                                  {groupWords.map((word) => (
                                    <div
                                      key={word.id}
                                      className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-white"
                                    >
                                      <Input
                                        value={word.chinese}
                                        onChange={(e) =>
                                          updateWordPair(
                                            word.id,
                                            'chinese',
                                            e.target.value
                                          )
                                        }
                                        placeholder="中文"
                                      />
                                      <Input
                                        value={word.english}
                                        onChange={(e) =>
                                          updateWordPair(
                                            word.id,
                                            'english',
                                            e.target.value
                                          )
                                        }
                                        placeholder="英文"
                                      />
                                      <Button
                                        onClick={() => deleteWordPair(word.id)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          // 显示选中的分组
                          <div>
                            {(() => {
                              const groupWords = editingWords.filter(
                                (word) => word.groupId === selectedGroupId
                              );
                              const group = editingGroups.find(
                                (g) => g.id === selectedGroupId
                              );

                              return (
                                <div>
                                  <h4 className="font-medium text-blue-600 mb-2 border-b pb-1">
                                    {group?.name} ({groupWords.length}对)
                                  </h4>
                                  <div className="space-y-2">
                                    {groupWords.map((word) => (
                                      <div
                                        key={word.id}
                                        className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-white"
                                      >
                                        <Input
                                          value={word.chinese}
                                          onChange={(e) =>
                                            updateWordPair(
                                              word.id,
                                              'chinese',
                                              e.target.value
                                            )
                                          }
                                          placeholder="中文"
                                        />
                                        <Input
                                          value={word.english}
                                          onChange={(e) =>
                                            updateWordPair(
                                              word.id,
                                              'english',
                                              e.target.value
                                            )
                                          }
                                          placeholder="英文"
                                        />
                                        <Button
                                          onClick={() =>
                                            deleteWordPair(word.id)
                                          }
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 保存按钮 */}
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsSettingsOpen(false)}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={saveGameSettings}
                        disabled={editingWords.length < pairsPerPlayer}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存设置{' '}
                        {editingWords.length < pairsPerPlayer &&
                          `(至少需要${pairsPerPlayer}对)`}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={toggleSound} variant="outline" size="sm">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>

              {/* 分组选择 */}
              <div className="flex items-center gap-2">
                <select
                  className="p-2 border rounded-md text-sm"
                  value={gameGroupId}
                  onChange={(e) => setGameGroupId(parseInt(e.target.value))}
                >
                  <option value={0}>全部分组</option>
                  {allWordGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {gameState === 'waiting' && (
                <Button
                  onClick={startGame}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  开始游戏
                </Button>
              )}

              <Button onClick={initializeGame} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                重新开始
              </Button>
            </div>
          </div>

          {/* 获胜提示 */}
          {winner && (
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-lg inline-block shadow-lg animate-bounce">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-8 h-8" />
                  <div>
                    <h2 className="text-3xl font-bold">{winner.name} 获胜！</h2>
                    <p className="text-lg">
                      用时: {formatTime(winner.completionTime || 0)}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8" />
                </div>
              </div>
            </div>
          )}

          {/* 双人游戏区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  winner?.id === player.id
                    ? 'winner-area bg-gradient-to-br from-yellow-50 to-orange-50'
                    : player.id === 1
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-purple-300 bg-purple-50'
                }`}
              >
                {/* 玩家信息 */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3
                      className={`text-2xl font-bold ${
                        player.id === 1 ? 'text-blue-700' : 'text-purple-700'
                      }`}
                    >
                      {player.name}
                    </h3>
                    {winner?.id === player.id && (
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex justify-center items-center gap-4">
                    <div
                      className={`text-lg font-semibold ${
                        player.id === 1 ? 'text-blue-600' : 'text-purple-600'
                      }`}
                    >
                      已配对: {player.score}/{pairsPerPlayer}
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        剩余: {player.gameWords.length / 2}对
                      </span>
                    </div>
                  </div>
                </div>

                {/* 游戏卡片区域 */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {player.gameWords.map((word) => (
                    <Card
                      key={word.id}
                      id={word.id}
                      className={`cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                        word.matched
                          ? 'opacity-20 cursor-not-allowed bg-green-100 border-green-300'
                          : word.isWrong
                          ? 'error-card'
                          : player.eliminatingCards.includes(word.id)
                          ? 'eliminating bg-gradient-to-r from-yellow-200 to-pink-200'
                          : player.selectedCards.includes(word.id)
                          ? word.type === 'chinese'
                            ? 'bg-blue-100 border-blue-400 shadow-lg scale-105'
                            : 'bg-purple-100 border-purple-400 shadow-lg scale-105'
                          : word.type === 'chinese'
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:shadow-md'
                          : 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:shadow-md'
                      }`}
                      onClick={() => handleCardClick(player.id, word.id)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleCardClick(player.id, word.id);
                      }}
                    >
                      <CardContent className="p-2 text-center relative">
                        <div
                          className={`font-semibold text-xs ${
                            word.type === 'chinese'
                              ? 'text-blue-700'
                              : 'text-purple-700'
                          }`}
                        >
                          {word.word}
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            word.type === 'chinese'
                              ? 'text-blue-500'
                              : 'text-purple-500'
                          }`}
                        >
                          {word.type === 'chinese' ? '中文' : 'EN'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-gray-500 text-sm space-y-1">
            <p>🏆 双人竞技模式：率先完成所有配对的玩家获胜</p>
            <p>⚙️ 点击"设置单词"可以自定义游戏单词</p>
            <p>🔊 点击单词卡片可以听到发音</p>
            <p>✨ 配对成功时会有炫酷的消除特效</p>
          </div>
        </div>
      </div>
    </>
  );
}
