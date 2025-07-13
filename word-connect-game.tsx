"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Volume2, VolumeX, Play, RotateCcw, Trophy, Zap, Settings, Plus, Trash2, Save } from "lucide-react"

interface WordPair {
  id: number
  chinese: string
  english: string
  matched: boolean
}

interface Player {
  id: 1 | 2
  name: string
  score: number
  gameWords: Array<{
    id: string
    word: string
    type: "chinese" | "english"
    pairId: number
    matched: boolean
    isWrong?: boolean
  }>
  selectedCards: string[]
  eliminatingCards: string[]
  completed: boolean
  completionTime?: number
}

const defaultWordPairs: WordPair[] = [
  { id: 1, chinese: "苹果", english: "Apple", matched: false },
  { id: 2, chinese: "香蕉", english: "Banana", matched: false },
  { id: 3, chinese: "橙子", english: "Orange", matched: false },
  { id: 4, chinese: "葡萄", english: "Grape", matched: false },
  { id: 5, chinese: "草莓", english: "Strawberry", matched: false },
  { id: 6, chinese: "西瓜", english: "Watermelon", matched: false },
  { id: 7, chinese: "桃子", english: "Peach", matched: false },
  { id: 8, chinese: "梨子", english: "Pear", matched: false },
  { id: 9, chinese: "柠檬", english: "Lemon", matched: false },
  { id: 10, chinese: "樱桃", english: "Cherry", matched: false },
  { id: 11, chinese: "芒果", english: "Mango", matched: false },
  { id: 12, chinese: "菠萝", english: "Pineapple", matched: false },
]

export default function Component() {
  const [allWordPairs, setAllWordPairs] = useState<WordPair[]>(defaultWordPairs)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingWords, setEditingWords] = useState<WordPair[]>([])
  const [newChinese, setNewChinese] = useState("")
  const [newEnglish, setNewEnglish] = useState("")

  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      name: "玩家1",
      score: 0,
      gameWords: [],
      selectedCards: [],
      eliminatingCards: [],
      completed: false,
    },
    {
      id: 2,
      name: "玩家2",
      score: 0,
      gameWords: [],
      selectedCards: [],
      eliminatingCards: [],
      completed: false,
    },
  ])

  const [gameState, setGameState] = useState<"waiting" | "playing" | "finished">("waiting")
  const [gameTime, setGameTime] = useState(0)
  const [winner, setWinner] = useState<Player | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // 从localStorage加载自定义单词
  useEffect(() => {
    const savedWords = localStorage.getItem("customWordPairs")
    if (savedWords) {
      try {
        const parsedWords = JSON.parse(savedWords)
        if (Array.isArray(parsedWords) && parsedWords.length > 0) {
          setAllWordPairs(parsedWords)
        }
      } catch (error) {
        console.error("Failed to load custom words:", error)
      }
    }
  }, [])

  // 保存自定义单词到localStorage
  const saveCustomWords = () => {
    localStorage.setItem("customWordPairs", JSON.stringify(editingWords))
    setAllWordPairs(editingWords)
    setIsSettingsOpen(false)
    // 重新初始化游戏
    initializeGame()
  }

  // 打开设置对话框
  const openSettings = () => {
    setEditingWords([...allWordPairs])
    setIsSettingsOpen(true)
  }

  // 添加新单词对
  const addWordPair = () => {
    if (newChinese.trim() && newEnglish.trim()) {
      const newId = Math.max(...editingWords.map((w) => w.id), 0) + 1
      const newPair: WordPair = {
        id: newId,
        chinese: newChinese.trim(),
        english: newEnglish.trim(),
        matched: false,
      }
      setEditingWords([...editingWords, newPair])
      setNewChinese("")
      setNewEnglish("")
    }
  }

  // 删除单词对
  const deleteWordPair = (id: number) => {
    setEditingWords(editingWords.filter((w) => w.id !== id))
  }

  // 编辑单词对
  const updateWordPair = (id: number, field: "chinese" | "english", value: string) => {
    setEditingWords(editingWords.map((w) => (w.id === id ? { ...w, [field]: value } : w)))
  }

  // 重置为默认单词
  const resetToDefault = () => {
    setEditingWords([...defaultWordPairs])
  }

  // 游戏计时器
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState === "playing") {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameState])

  // 初始化游戏
  const initializeGame = useCallback(() => {
    if (allWordPairs.length < 12) {
      alert("至少需要12对单词才能开始游戏！")
      return
    }

    // 为每个玩家分配6对单词
    const shuffledPairs = [...allWordPairs].sort(() => Math.random() - 0.5)
    const player1Pairs = shuffledPairs.slice(0, 6)
    const player2Pairs = shuffledPairs.slice(6, 12)

    const createPlayerWords = (pairs: WordPair[], playerId: number) => {
      const words = []
      pairs.forEach((pair) => {
        words.push({
          id: `p${playerId}-chinese-${pair.id}`,
          word: pair.chinese,
          type: "chinese" as const,
          pairId: pair.id,
          matched: false,
          isWrong: false,
        })
        words.push({
          id: `p${playerId}-english-${pair.id}`,
          word: pair.english,
          type: "english" as const,
          pairId: pair.id,
          matched: false,
          isWrong: false,
        })
      })
      return words.sort(() => Math.random() - 0.5)
    }

    setPlayers([
      {
        id: 1,
        name: "玩家1",
        score: 0,
        gameWords: createPlayerWords(player1Pairs, 1),
        selectedCards: [],
        eliminatingCards: [],
        completed: false,
      },
      {
        id: 2,
        name: "玩家2",
        score: 0,
        gameWords: createPlayerWords(player2Pairs, 2),
        selectedCards: [],
        eliminatingCards: [],
        completed: false,
      },
    ])

    setGameState("waiting")
    setGameTime(0)
    setWinner(null)
  }, [allWordPairs])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  // 开始游戏
  const startGame = () => {
    setGameState("playing")
    setGameTime(0)
  }

  // 发音功能
  const speakWord = (word: string, type: "chinese" | "english") => {
    if (!soundEnabled || !window.speechSynthesis) return

    const utterance = new SpeechSynthesisUtterance(word)
    if (type === "chinese") {
      utterance.lang = "zh-CN"
      utterance.rate = 0.8
    } else {
      utterance.lang = "en-US"
      utterance.rate = 0.9
    }
    utterance.volume = 0.8
    window.speechSynthesis.speak(utterance)
  }

  // 创建消除特效
  const createEliminationEffect = (cardId: string) => {
    const cardElement = document.getElementById(cardId)
    if (!cardElement) return

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("div")
      particle.className = "particle"
      particle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: ${Math.random() > 0.5 ? "#3b82f6" : "#8b5cf6"};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: particle-explosion 0.6s ease-out forwards;
      `

      const rect = cardElement.getBoundingClientRect()
      particle.style.left = `${rect.left + rect.width / 2}px`
      particle.style.top = `${rect.top + rect.height / 2}px`

      const angle = (i / 8) * Math.PI * 2
      const velocity = 80 + Math.random() * 40
      particle.style.setProperty("--dx", `${Math.cos(angle) * velocity}px`)
      particle.style.setProperty("--dy", `${Math.sin(angle) * velocity}px`)

      document.body.appendChild(particle)

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 600)
    }
  }

  // 创建获胜特效
  const createWinnerEffect = () => {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const firework = document.createElement("div")
        firework.className = "firework"
        firework.style.cssText = `
          position: fixed;
          width: 4px;
          height: 4px;
          background: ${["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"][Math.floor(Math.random() * 6)]};
          border-radius: 50%;
          pointer-events: none;
          z-index: 2000;
          left: ${Math.random() * window.innerWidth}px;
          top: ${Math.random() * window.innerHeight}px;
          animation: firework-explosion 2s ease-out forwards;
        `

        document.body.appendChild(firework)

        setTimeout(() => {
          if (firework.parentNode) {
            firework.parentNode.removeChild(firework)
          }
        }, 2000)
      }, i * 50)
    }
  }

  // 处理卡片点击
  const handleCardClick = (playerId: 1 | 2, cardId: string) => {
    if (gameState !== "playing") return

    const player = players.find((p) => p.id === playerId)
    if (!player || player.completed) return

    const card = player.gameWords.find((w) => w.id === cardId)
    if (!card || card.matched || player.selectedCards.includes(cardId) || player.eliminatingCards.includes(cardId)) {
      return
    }

    speakWord(card.word, card.type)

    const newSelectedCards = [...player.selectedCards, cardId]

    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, selectedCards: newSelectedCards } : p)))

    if (newSelectedCards.length === 2) {
      const [firstCardId, secondCardId] = newSelectedCards
      const firstCard = player.gameWords.find((w) => w.id === firstCardId)
      const secondCard = player.gameWords.find((w) => w.id === secondCardId)

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
        // 匹配成功
        setPlayers((prev) =>
          prev.map((p) => (p.id === playerId ? { ...p, eliminatingCards: [firstCardId, secondCardId] } : p)),
        )

        setTimeout(() => {
          createEliminationEffect(firstCardId)
          createEliminationEffect(secondCardId)
        }, 100)

        setTimeout(() => {
          setPlayers((prev) =>
            prev.map((p) => {
              if (p.id === playerId) {
                const newGameWords = p.gameWords.filter((w) => w.id !== firstCardId && w.id !== secondCardId)
                const newScore = p.score + 1
                const completed = newGameWords.length === 0

                if (completed && !winner) {
                  const completionTime = gameTime
                  setWinner({ ...p, score: newScore, completed: true, completionTime })
                  setGameState("finished")
                  createWinnerEffect()

                  if (soundEnabled) {
                    const winSound = new SpeechSynthesisUtterance(`${p.name}获胜！`)
                    winSound.lang = "zh-CN"
                    winSound.rate = 0.8
                    window.speechSynthesis.speak(winSound)
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
                }
              }
              return p
            }),
          )
        }, 600)
      } else {
        // 匹配失败
        const wrongCards = [firstCardId, secondCardId]

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  gameWords: p.gameWords.map((word) =>
                    wrongCards.includes(word.id) ? { ...word, isWrong: true } : word,
                  ),
                }
              : p,
          ),
        )

        if (soundEnabled) {
          const errorSound = new SpeechSynthesisUtterance("错误")
          errorSound.lang = "zh-CN"
          errorSound.rate = 1.2
          errorSound.pitch = 0.8
          window.speechSynthesis.speak(errorSound)
        }

        setTimeout(() => {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === playerId
                ? {
                    ...p,
                    gameWords: p.gameWords.map((word) => ({ ...word, isWrong: false })),
                    selectedCards: [],
                  }
                : p,
            ),
          )
        }, 1000)
      }
    }
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

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
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(0.9); }
        }
        
        @keyframes rainbow-border {
          0% { border-color: #3b82f6; }
          25% { border-color: #8b5cf6; }
          50% { border-color: #ec4899; }
          75% { border-color: #f59e0b; }
          100% { border-color: #10b981; }
        }
        
        .eliminating {
          animation: elimination-pulse 0.6s ease-in-out, rainbow-border 0.6s ease-in-out;
          border-width: 3px !important;
        }

        @keyframes shake-error {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }

        @keyframes error-flash {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(239, 68, 68, 0.3); }
        }

        .error-card {
          animation: shake-error 0.6s ease-in-out, error-flash 0.6s ease-in-out;
          border-color: #ef4444 !important;
          border-width: 2px !important;
        }

        @keyframes winner-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
        }

        .winner-area {
          animation: winner-glow 2s ease-in-out infinite;
          border: 3px solid #FFD700;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* 游戏标题和控制区 */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">双人单词消消乐</h1>
            <p className="text-gray-600 mb-4">两人比拼，看谁先完成所有配对！</p>

            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="text-2xl font-bold text-blue-600">{formatTime(gameTime)}</div>

              {/* 设置按钮 */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openSettings} variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    设置单词
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>自定义单词设置</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* 添加新单词 */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="text-lg font-semibold mb-3">添加新单词对</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="newChinese">中文</Label>
                          <Input
                            id="newChinese"
                            value={newChinese}
                            onChange={(e) => setNewChinese(e.target.value)}
                            placeholder="输入中文单词"
                            onKeyPress={(e) => e.key === "Enter" && addWordPair()}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newEnglish">英文</Label>
                          <Input
                            id="newEnglish"
                            value={newEnglish}
                            onChange={(e) => setNewEnglish(e.target.value)}
                            placeholder="输入英文单词"
                            onKeyPress={(e) => e.key === "Enter" && addWordPair()}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={addWordPair} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            添加
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 单词列表 */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">单词列表 ({editingWords.length}对)</h3>
                        <Button onClick={resetToDefault} variant="outline" size="sm">
                          恢复默认
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {editingWords.map((word) => (
                          <div
                            key={word.id}
                            className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-white"
                          >
                            <Input
                              value={word.chinese}
                              onChange={(e) => updateWordPair(word.id, "chinese", e.target.value)}
                              placeholder="中文"
                            />
                            <Input
                              value={word.english}
                              onChange={(e) => updateWordPair(word.id, "english", e.target.value)}
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

                    {/* 保存按钮 */}
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                        取消
                      </Button>
                      <Button
                        onClick={saveCustomWords}
                        disabled={editingWords.length < 12}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存设置 {editingWords.length < 12 && `(至少需要12对)`}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={toggleSound} variant="outline" size="sm">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              {gameState === "waiting" && (
                <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
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
                    <p className="text-lg">用时: {formatTime(winner.completionTime || 0)}</p>
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
                    ? "winner-area bg-gradient-to-br from-yellow-50 to-orange-50"
                    : player.id === 1
                      ? "border-blue-300 bg-blue-50"
                      : "border-purple-300 bg-purple-50"
                }`}
              >
                {/* 玩家信息 */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className={`text-2xl font-bold ${player.id === 1 ? "text-blue-700" : "text-purple-700"}`}>
                      {player.name}
                    </h3>
                    {winner?.id === player.id && <Trophy className="w-6 h-6 text-yellow-500" />}
                  </div>
                  <div className="flex justify-center items-center gap-4">
                    <div className={`text-lg font-semibold ${player.id === 1 ? "text-blue-600" : "text-purple-600"}`}>
                      已配对: {player.score}/6
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">剩余: {player.gameWords.length / 2}对</span>
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
                          ? "opacity-20 cursor-not-allowed bg-green-100 border-green-300"
                          : word.isWrong
                            ? "error-card"
                            : player.eliminatingCards.includes(word.id)
                              ? "eliminating bg-gradient-to-r from-yellow-200 to-pink-200"
                              : player.selectedCards.includes(word.id)
                                ? word.type === "chinese"
                                  ? "bg-blue-100 border-blue-400 shadow-lg scale-105"
                                  : "bg-purple-100 border-purple-400 shadow-lg scale-105"
                                : word.type === "chinese"
                                  ? "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:shadow-md"
                                  : "bg-purple-50 border-purple-200 hover:bg-purple-100 hover:shadow-md"
                      }`}
                      onClick={() => handleCardClick(player.id, word.id)}
                    >
                      <CardContent className="p-2 text-center relative">
                        <div
                          className={`font-semibold text-xs ${
                            word.type === "chinese" ? "text-blue-700" : "text-purple-700"
                          }`}
                        >
                          {word.word}
                        </div>
                        <div
                          className={`text-xs mt-1 ${word.type === "chinese" ? "text-blue-500" : "text-purple-500"}`}
                        >
                          {word.type === "chinese" ? "中文" : "EN"}
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
  )
}
