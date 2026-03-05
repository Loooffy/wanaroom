import React, { useState, useEffect, useRef } from 'react';
import TamagotchiDisplay from './TamagotchiDisplay';
import { useBeep } from '../hooks/useBeep';
import { generateTamagotchiResponse, TamagotchiState, AIResponse } from '../services/ai';
import { 
  Send, Utensils, Gamepad2, Moon, Cat, Heart, 
  Shirt, Bath, Cloud, BriefcaseMedical, BrainCircuit, 
  PhoneCall, MessageSquareDashed, BookLock, Flower, 
  Music4, Mail, Gift, ArrowLeft, ChevronRight, ChevronLeft,
  Users, Smile, Activity, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type MenuLevel = 'main' | 'tamagotchi' | 'player' | 'first_aid' | 'anon_msg' | 'care_others' | 'reply_msg' | 'send_gift' | 'mood_tracker' | 'status_check' | 'friend_status';

const MOCK_ANON_MESSAGES = [
  "I feel so lonely sometimes, even when I'm around people.",
  "I'm afraid I'm not good enough for my dream job.",
  "Today was really hard, I just want to cry.",
  "I miss my childhood pet so much.",
  "I don't know if I'm making the right choices in life.",
  "Does anyone else feel like they're just pretending to be an adult?",
  "I wish I could tell my parents how I really feel.",
  "I'm struggling to find motivation lately."
];

const TAMAGOTCHI_THOUGHTS = [
  "Oh... that sounds heavy. I'm listening.",
  "I believe in you! You can do it!",
  "It's okay to cry. I'll be here.",
  "Pets are family. I miss them too.",
  "Life is a maze, but we can walk together.",
  "Adulting is hard! I'm just a pixel and I know that.",
  "Honesty is brave. Take your time.",
  "One step at a time. Even a small step counts."
];

const GIFTS = [
  { id: 'hat_red', name: 'Red Hat', icon: '🧢' },
  { id: 'glasses', name: 'Cool Glasses', icon: '👓' },
  { id: 'bowtie', name: 'Bow Tie', icon: '🎀' },
  { id: 'crown', name: 'Tiny Crown', icon: '👑' },
  { id: 'flower', name: 'Flower Pin', icon: '🌸' },
  { id: 'scarf', name: 'Cozy Scarf', icon: '🧣' }
];

const MOODS = [
  { id: 'happy', label: 'Happy', icon: '😊', color: 'text-yellow-400', border: 'hover:border-yellow-400' },
  { id: 'sad', label: 'Sad', icon: '😢', color: 'text-blue-400', border: 'hover:border-blue-400' },
  { id: 'angry', label: 'Angry', icon: '😠', color: 'text-red-500', border: 'hover:border-red-500' },
  { id: 'anxious', label: 'Anxious', icon: '😰', color: 'text-purple-400', border: 'hover:border-purple-400' },
  { id: 'tired', label: 'Tired', icon: '😴', color: 'text-gray-400', border: 'hover:border-gray-400' },
  { id: 'neutral', label: 'Okay', icon: '😐', color: 'text-green-400', border: 'hover:border-green-400' },
];

const STATUS_QUESTIONS = [
  "社交退縮的程度?",
  "自殺念頭的程度?",
  "無法揮去某些念頭的程度?",
  "動力低落的程度?",
  "失眠的程度?",
  "嗜睡的程度?",
  "上癮的程度?"
];

export default function Console() {
  const [state, setState] = useState<TamagotchiState>({
    hunger: 50,
    happiness: 50,
    energy: 50,
    lastAction: 'init',
  });
  
  const [aiResponse, setAiResponse] = useState<AIResponse>({
    message: "Hi! Who are we caring for today?",
    expression: "happy",
    sound: "chirp",
    statsUpdate: { hunger: 0, happiness: 0, energy: 0 },
  });

  const [input, setInput] = useState('');
  const [anonMessage, setAnonMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [targetMessageIndex, setTargetMessageIndex] = useState(0);
  const [isReplying, setIsReplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuLevel, setMenuLevel] = useState<MenuLevel>('main');
  const [inventory, setInventory] = useState<string[]>([]);
  const [wearing, setWearing] = useState<string | null>(null);
  
  const [statusQuestionIndex, setStatusQuestionIndex] = useState(0);
  const [statusAnswers, setStatusAnswers] = useState<number[]>([]);

  const playBeep = useBeep();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiResponse]);

  // Update Tamagotchi thought when browsing messages
  useEffect(() => {
    if (menuLevel === 'reply_msg' && !isReplying) {
      const thought = TAMAGOTCHI_THOUGHTS[targetMessageIndex % TAMAGOTCHI_THOUGHTS.length];
      setAiResponse(prev => ({
        ...prev,
        message: thought,
        expression: 'neutral',
        sound: 'soft_hum'
      }));
    }
  }, [menuLevel, targetMessageIndex, isReplying]);

  const handleAction = async (action: string, type: 'action' | 'chat') => {
    if (loading) return;
    setLoading(true);
    
    try {
      // Optimistic UI update
      playBeep('neutral'); 
      
      const newState = { ...state, lastAction: action };
      
      // Call AI
      const response = await generateTamagotchiResponse(action, newState);
      
      // Update state based on AI response
      setState(prev => ({
        hunger: Math.max(0, Math.min(100, prev.hunger + response.statsUpdate.hunger)),
        happiness: Math.max(0, Math.min(100, prev.happiness + response.statsUpdate.happiness)),
        energy: Math.max(0, Math.min(100, prev.energy + response.statsUpdate.energy)),
        lastAction: action
      }));

      setAiResponse(response);
      
      // Play sound based on expression
      if (response.expression === 'happy') playBeep('happy');
      else if (response.expression === 'sad') playBeep('sad');
      else if (response.expression === 'eating') playBeep('eating');
      else if (response.expression === 'sleeping') playBeep('sleeping');
      else playBeep('neutral');
    } catch (error) {
      console.error("Interaction failed:", error);
      setAiResponse(prev => ({ ...prev, message: "..." }));
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleNextCard = () => {
    setTargetMessageIndex((prev) => (prev + 1) % MOCK_ANON_MESSAGES.length);
  };

  const handlePrevCard = () => {
    setTargetMessageIndex((prev) => (prev - 1 + MOCK_ANON_MESSAGES.length) % MOCK_ANON_MESSAGES.length);
  };

  const handleSendGift = (giftId: string) => {
    // Simulate receiving the gift yourself for demo purposes (in a real app, this would go to another user)
    // But here we add it to OUR inventory to simulate "someone sent it" or just to show it works.
    // Actually, let's just say "You sent a gift!" and maybe randomly receive one back later?
    // For now, let's just add it to inventory to demonstrate the "wear" feature requested.
    if (!inventory.includes(giftId)) {
      setInventory(prev => [...prev, giftId]);
    }
    handleAction(`Sent a gift: ${GIFTS.find(g => g.id === giftId)?.name}`, 'action');
    setMenuLevel('care_others');
  };

  const startStatusCheck = () => {
    setStatusQuestionIndex(0);
    setStatusAnswers([]);
    setMenuLevel('status_check');
    setAiResponse(prev => ({
      ...prev,
      message: STATUS_QUESTIONS[0],
      expression: 'neutral',
      sound: 'soft_hum'
    }));
  };

  const handleStatusAnswer = (score: number) => {
    const newAnswers = [...statusAnswers, score];
    setStatusAnswers(newAnswers);
    playBeep('neutral');

    if (statusQuestionIndex < STATUS_QUESTIONS.length - 1) {
      const nextIndex = statusQuestionIndex + 1;
      setStatusQuestionIndex(nextIndex);
      setAiResponse(prev => ({
        ...prev,
        message: STATUS_QUESTIONS[nextIndex],
        expression: 'neutral',
        sound: 'soft_hum'
      }));
    } else {
      // Finished
      handleAction(`Completed status check. Scores: ${newAnswers.join(', ')}`, 'action');
      setMenuLevel('player');
    }
  };

  const renderMenu = () => {
    if (menuLevel === 'main') {
      return (
        <div className="flex gap-4 justify-center w-full">
          <button 
            onClick={() => {
              setMenuLevel('tamagotchi');
              setAiResponse(prev => ({ ...prev, message: "What do you want to do?", expression: 'happy' }));
            }}
            className="flex flex-col items-center gap-2 group w-24 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="p-5 rounded-3xl bg-yellow-400 shadow-[0_6px_0_#D97706] group-hover:-translate-y-1 group-hover:shadow-[0_8px_0_#D97706] group-active:translate-y-2 group-active:shadow-none transition-all text-yellow-900 border-2 border-yellow-300">
              <Cat size={36} />
            </div>
            <span className="text-xs font-black text-slate-600 group-hover:text-slate-800 uppercase tracking-wide mt-1">Care for Me</span>
          </button>
          <button 
            onClick={() => {
              setMenuLevel('player');
              setAiResponse(prev => ({ ...prev, message: "What do you want to do?", expression: 'happy' }));
            }}
            className="flex flex-col items-center gap-2 group w-24 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="p-5 rounded-3xl bg-pink-400 shadow-[0_6px_0_#DB2777] group-hover:-translate-y-1 group-hover:shadow-[0_8px_0_#DB2777] group-active:translate-y-2 group-active:shadow-none transition-all text-pink-900 border-2 border-pink-300">
              <Heart size={36} />
            </div>
            <span className="text-xs font-black text-slate-600 group-hover:text-slate-800 uppercase tracking-wide mt-1">Care for You</span>
          </button>
          <button 
            onClick={() => {
              setMenuLevel('care_others');
              setAiResponse(prev => ({ ...prev, message: "What do you want to do?", expression: 'happy' }));
            }}
            className="flex flex-col items-center gap-2 group w-24 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="p-5 rounded-3xl bg-teal-400 shadow-[0_6px_0_#0D9488] group-hover:-translate-y-1 group-hover:shadow-[0_8px_0_#0D9488] group-active:translate-y-2 group-active:shadow-none transition-all text-teal-900 border-2 border-teal-300">
              <Users size={36} />
            </div>
            <span className="text-xs font-black text-slate-600 group-hover:text-slate-800 uppercase tracking-wide mt-1">Care for Others</span>
          </button>
        </div>
      );
    }

    const renderGridButton = (icon: React.ReactNode, label: string, onClick: () => void, textClass: string, bgClass: string) => (
      <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 group w-20 active:scale-95 transition-transform cursor-pointer`}
        title={label}
      >
        <div className={`p-3 rounded-2xl ${bgClass} shadow-[0_4px_0_rgba(0,0,0,0.1)] group-hover:-translate-y-1 group-hover:shadow-[0_6px_0_rgba(0,0,0,0.1)] group-active:translate-y-1 group-active:shadow-none transition-all ${textClass} border-2 border-white/50`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-500 text-center leading-tight group-hover:text-slate-700 uppercase tracking-wide mt-1">{label}</span>
      </button>
    );

    return (
      <div className="flex flex-col items-center w-full gap-4">
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {menuLevel === 'tamagotchi' && (
            <>
              {renderGridButton(<Utensils size={24} />, "Feed", () => handleAction("Feed me", 'action'), "text-orange-500", "bg-orange-100")}
              {renderGridButton(<Shirt size={24} />, "Clothes", () => {
                 if (inventory.length > 0) {
                   const nextIndex = inventory.indexOf(wearing || '') + 1;
                   const nextItem = nextIndex < inventory.length ? inventory[nextIndex] : null;
                   setWearing(nextItem);
                   handleAction(nextItem ? `Put on ${GIFTS.find(g => g.id === nextItem)?.name}` : "Took off clothes", 'action');
                 } else {
                   handleAction("I don't have any clothes yet!", 'action');
                 }
              }, "text-purple-500", "bg-purple-100")}
              {renderGridButton(<Gamepad2 size={24} />, "Play", () => handleAction("Play a game", 'action'), "text-green-500", "bg-green-100")}
              {renderGridButton(<Moon size={24} />, "Sleep", () => handleAction("Go to sleep", 'action'), "text-blue-500", "bg-blue-100")}
              {renderGridButton(<Bath size={24} />, "Bath", () => handleAction("Take a bath", 'action'), "text-cyan-500", "bg-cyan-100")}
              {renderGridButton(<Cloud size={24} />, "Zone Out", () => handleAction("Zone out together", 'action'), "text-slate-500", "bg-slate-100")}
            </>
          )}

          {menuLevel === 'player' && (
            <>
              {renderGridButton(<BriefcaseMedical size={24} />, "First Aid", () => setMenuLevel('first_aid'), "text-red-500", "bg-red-100")}
              {renderGridButton(<BrainCircuit size={24} />, "Counseling", () => handleAction("Counseling resources", 'action'), "text-teal-500", "bg-teal-100")}
              {renderGridButton(<PhoneCall size={24} />, "Helpline", () => handleAction("Emergency helpline", 'action'), "text-rose-600", "bg-rose-100")}
              {renderGridButton(<MessageSquareDashed size={24} />, "Anon Msg", () => setMenuLevel('anon_msg'), "text-indigo-500", "bg-indigo-100")}
              {renderGridButton(<BookLock size={24} />, "Diary", () => handleAction("Private diary", 'action'), "text-amber-700", "bg-amber-100")}
              {renderGridButton(<Flower size={24} />, "Meditate", () => handleAction("Mindfulness meditation", 'action'), "text-emerald-500", "bg-emerald-100")}
              {renderGridButton(<Music4 size={24} />, "Relax", () => handleAction("Relaxing sounds", 'action'), "text-sky-400", "bg-sky-100")}
              {renderGridButton(<Smile size={24} />, "Mood", () => setMenuLevel('mood_tracker'), "text-yellow-500", "bg-yellow-100")}
              {renderGridButton(<Activity size={24} />, "Status", () => startStatusCheck(), "text-rose-400", "bg-rose-50")}
            </>
          )}

          {menuLevel === 'care_others' && (
            <>
              {renderGridButton(<Mail size={24} />, "Reply", () => {
                setMenuLevel('reply_msg');
                setIsReplying(false);
                setTargetMessageIndex(0);
              }, "text-yellow-600", "bg-yellow-100")}
              {renderGridButton(<Gift size={24} />, "Send Gift", () => setMenuLevel('send_gift'), "text-pink-500", "bg-pink-100")}
              {renderGridButton(<UserCheck size={24} />, "Friend", () => {
                setMenuLevel('friend_status');
                handleAction("Checking friend's status...", 'action');
              }, "text-teal-600", "bg-teal-100")}
            </>
          )}

          {menuLevel === 'first_aid' && (
            <>
              {renderGridButton(<Bath size={24} />, "Shower", () => handleAction("Take a hot shower", 'action'), "text-cyan-500", "bg-cyan-100")}
              {renderGridButton(<Cloud size={24} />, "Breathe", () => handleAction("Take a deep breath", 'action'), "text-sky-500", "bg-sky-100")}
              {renderGridButton(<PhoneCall size={24} />, "Lifeline", () => handleAction("Call Lifeline 1995", 'action'), "text-red-500", "bg-red-100")}
              {renderGridButton(<BriefcaseMedical size={24} />, "Medicine", () => handleAction("Take medicine", 'action'), "text-pink-500", "bg-pink-100")}
            </>
          )}

          {menuLevel === 'send_gift' && GIFTS.map(gift => (
             renderGridButton(<span className="text-2xl">{gift.icon}</span>, gift.name, () => handleSendGift(gift.id), "text-slate-700", "bg-white")
          ))}

          {menuLevel === 'mood_tracker' && MOODS.map(mood => (
             renderGridButton(<span className="text-2xl">{mood.icon}</span>, mood.label, () => {
               handleAction(`I am feeling ${mood.label.toLowerCase()}`, 'action');
               setMenuLevel('player');
             }, mood.color.replace('text-', 'text-'), "bg-white")
          ))}

          {menuLevel === 'status_check' && [1, 2, 3, 4, 5].map(score => (
             renderGridButton(
               <span className="text-2xl font-bold">{score}</span>, 
               "Level", 
               () => handleStatusAnswer(score), 
               "text-slate-700",
               "bg-white"
             )
          ))}
        </div>
        
        {menuLevel === 'friend_status' && (
          <div className="w-full bg-white/90 border-4 border-white rounded-3xl p-4 flex flex-col gap-3 shadow-lg text-slate-700">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 border-2 border-teal-200">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Alex</h3>
                <p className="text-xs text-slate-500 font-bold">Last active: 10m ago</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
                <span className="text-slate-400 font-bold text-xs block mb-1 uppercase tracking-wider">Mood</span>
                <span className="text-purple-600 font-black text-lg">Anxious 😰</span>
              </div>
              <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-100">
                <span className="text-slate-400 font-bold text-xs block mb-1 uppercase tracking-wider">Needs</span>
                <span className="text-yellow-600 font-black text-lg">Company</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
              <span className="text-slate-400 font-bold block mb-2 uppercase tracking-wider">Pet Status</span>
              <div className="flex justify-between text-slate-600 font-bold mb-1">
                <span>Hunger</span>
                <span>80%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mb-2 overflow-hidden">
                <div className="bg-green-400 h-full w-[80%] rounded-full"></div>
              </div>
              
              <div className="flex justify-between text-slate-600 font-bold mb-1">
                 <span>Happiness</span>
                 <span>30%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-red-400 h-full w-[30%] rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        
        {menuLevel === 'anon_msg' && (
          <div className="w-full flex flex-col gap-3">
            <textarea
              value={anonMessage}
              onChange={(e) => setAnonMessage(e.target.value)}
              placeholder="Write whatever is on your mind..."
              className="w-full h-32 bg-white/90 border-4 border-white rounded-3xl p-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-300 transition-colors resize-none placeholder:text-slate-400 shadow-lg font-bold"
            />
            <button
              onClick={() => {
                if (anonMessage.trim()) {
                  handleAction(`Anonymous Message: ${anonMessage}`, 'chat');
                  setAnonMessage('');
                  setMenuLevel('player');
                }
              }}
              disabled={!anonMessage.trim() || loading}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm transition-all shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
            >
              <Send size={18} /> Send to the Void
            </button>
          </div>
        )}

        {menuLevel === 'reply_msg' && (
          <div className="w-full flex flex-col gap-3 items-center">
            {!isReplying ? (
              // Card Browser
              <div className="w-full flex items-center justify-between gap-2">
                <button onClick={handlePrevCard} className="p-2 bg-white/20 hover:bg-white/40 hover:-translate-y-0.5 active:translate-y-0.5 rounded-full text-white transition-all cursor-pointer">
                  <ChevronLeft size={28} />
                </button>
                
                <div className="flex-1 h-48 relative perspective-1000">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={targetMessageIndex}
                      initial={{ opacity: 0, x: 50, rotateY: -10 }}
                      animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      exit={{ opacity: 0, x: -50, rotateY: 10 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 bg-white border-4 border-white rounded-3xl p-5 flex flex-col justify-between shadow-xl rotate-1"
                    >
                      <p className="text-base text-slate-600 font-bold italic leading-relaxed">"{MOCK_ANON_MESSAGES[targetMessageIndex]}"</p>
                      <button
                        onClick={() => setIsReplying(true)}
                        className="self-end text-xs bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full hover:bg-yellow-300 hover:-translate-y-0.5 active:translate-y-0.5 transition-all font-black uppercase tracking-wide shadow-sm cursor-pointer"
                      >
                        Reply
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <button onClick={handleNextCard} className="p-2 bg-white/20 hover:bg-white/40 hover:-translate-y-0.5 active:translate-y-0.5 rounded-full text-white transition-all cursor-pointer">
                  <ChevronRight size={28} />
                </button>
              </div>
            ) : (
              // Reply Input
              <div className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white/20 p-3 rounded-xl text-xs text-white font-bold italic mb-1">
                  Replying to: "{MOCK_ANON_MESSAGES[targetMessageIndex]}"
                </div>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write a kind reply..."
                  className="w-full h-32 bg-white/90 border-4 border-white rounded-3xl p-4 text-sm text-slate-700 focus:outline-none focus:border-yellow-300 transition-colors resize-none placeholder:text-slate-400 shadow-lg font-bold"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsReplying(false)}
                    className="flex-1 py-3 bg-slate-400 hover:bg-slate-300 hover:-translate-y-1 text-white rounded-2xl font-black text-sm transition-all shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] uppercase tracking-wide cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (replyMessage.trim()) {
                        handleAction(`Replied to anon message: "${MOCK_ANON_MESSAGES[targetMessageIndex]}" with: "${replyMessage}"`, 'chat');
                        setReplyMessage('');
                        setMenuLevel('care_others');
                        setIsReplying(false);
                      }
                    }}
                    disabled={!replyMessage.trim() || loading}
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-900 rounded-2xl font-black text-sm transition-all shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
                  >
                    <Send size={18} /> Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={() => {
            if (menuLevel === 'first_aid' || menuLevel === 'anon_msg' || menuLevel === 'mood_tracker' || menuLevel === 'status_check') {
              setMenuLevel('player');
              setAiResponse(prev => ({ ...prev, message: "What do you want to do?", expression: 'happy' }));
            } else if (menuLevel === 'reply_msg' || menuLevel === 'send_gift' || menuLevel === 'friend_status') {
              setMenuLevel('care_others');
              setAiResponse(prev => ({ ...prev, message: "What do you want to do?", expression: 'happy' }));
            } else {
              setMenuLevel('main');
              setAiResponse(prev => ({ ...prev, message: "Who do you want to take care of?", expression: 'happy' }));
            }
          }}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white mt-4 font-bold bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> BACK
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-[#57C5B6] p-4 pt-32 font-sans text-slate-800 relative overflow-hidden">
      {/* Decorative Clouds */}
      <div className="absolute top-10 -left-10 w-40 h-16 bg-[#EFFFFD] rounded-full opacity-30 blur-xl"></div>
      <div className="absolute top-32 -right-10 w-56 h-20 bg-[#EFFFFD] rounded-full opacity-30 blur-xl"></div>
      <div className="absolute bottom-20 left-10 w-32 h-12 bg-[#EFFFFD] rounded-full opacity-20 blur-xl"></div>

      <div className="relative flex flex-col items-center gap-6 w-full max-w-md z-10">
        {/* Speech Bubble */}
        {aiResponse.message && (
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-72 bg-white text-slate-800 p-5 rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-20 animate-in fade-in zoom-in duration-300">
            <div className="text-center font-black text-lg leading-tight">
              {loading ? "..." : aiResponse.message}
            </div>
            {/* Bubble Tail */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
          </div>
        )}

        {/* Screen Only */}
        <div className="w-64 h-64 bg-[#F0F7F4] shadow-[0_12px_0_rgba(0,0,0,0.1)] border-[6px] border-white relative overflow-hidden rounded-[2.5rem] shrink-0">
          <TamagotchiDisplay expression={aiResponse.expression} isTalking={loading} />
          
          {/* Wearable Overlay */}
          {wearing && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl pointer-events-none z-10 animate-bounce">
              {GIFTS.find(g => g.id === wearing)?.icon}
            </div>
          )}
          
          {/* Stats Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
             <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
               <div className="bg-orange-400 h-full" style={{ width: `${state.hunger}%` }}></div>
             </div>
             <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
               <div className="bg-pink-400 h-full" style={{ width: `${state.happiness}%` }}></div>
             </div>
             <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
               <div className="bg-blue-400 h-full" style={{ width: `${state.energy}%` }}></div>
             </div>
          </div>
        </div>

        {/* Dynamic Menu */}
        <div className="w-full min-h-[200px] flex items-start justify-center">
          {renderMenu()}
        </div>

        {/* Reset Button (Hidden-ish) */}
        <button 
          onClick={() => {
            if (confirm('Reset your pet?')) {
              setState({ hunger: 50, happiness: 50, energy: 50, lastAction: 'reset' });
              setAiResponse({ message: "Hi! Who are we caring for today?", expression: "happy", sound: "chirp", statsUpdate: { hunger: 0, happiness: 0, energy: 0 } });
              setMenuLevel('main');
              setInventory([]);
              setWearing(null);
              playBeep('happy');
            }
          }}
          className="opacity-30 hover:opacity-100 text-xs text-white font-bold transition-all absolute top-0 right-0 bg-black/20 px-2 py-1 rounded-lg hover:bg-red-500/80 hover:scale-105 active:scale-95 cursor-pointer"
        >
          RESET
        </button>
      </div>

      {/* User Input Only - REMOVED */}
      {/* <div className="w-full max-w-md mt-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); if(input.trim()) handleAction(input, 'chat'); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-neutral-800 border-2 border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors font-sans"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div> */}
    </div>
  );
}
