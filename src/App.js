import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth'; 
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { Loader2, Share2, PenTool, Check, Link, Sparkles, Users, User, Play } from 'lucide-react';

// ==========================================
// 步驟 1: 請在此填入您的 Firebase 設定
// (前往 Firebase Console -> Project Settings -> General -> Your apps 取得)
// ==========================================
const MANUAL_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// --- Firebase Initialization ---
let firebaseConfig;
try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    firebaseConfig = MANUAL_CONFIG;
  }
} catch (e) {
  firebaseConfig = MANUAL_CONFIG;
}

const isConfigValid = firebaseConfig && firebaseConfig.apiKey;
const app = isConfigValid ? initializeApp(firebaseConfig) : null;
const auth = isConfigValid ? getAuth(app) : null;
const db = isConfigValid ? getFirestore(app) : null;
// 使用 v3 確保與舊版資料隔離
const appId = typeof __app_id !== 'undefined' ? __app_id : 'telestration_game_v3';

// --- AI Topics ---
const AI_TOPICS = [
    "騎單車的暴龍", "在太空吃拉麵", "跳芭蕾舞的相撲選手", "傷心的馬鈴薯", "會飛的企鵝",
    "正在自拍的蒙娜麗莎", "戴墨鏡的太陽", "怕水的鯊魚", "彈吉他的章魚", "喝珍珠奶茶的外星人",
    "長頸鹿在溜滑梯", "穿裙子的獅子", "著火的冰淇淋", "在圖書館跳舞的雞", "開跑車的蝸牛",
    "打網球的蚊子", "正在洗澡的貓咪", "超人不會飛", "便祕的馬桶", "會隱形的豬",
    "在月球上烤肉", "長了腳的魚", "正在開會的螞蟻", "穿西裝的香蕉", "會說話的漢堡",
    "正在做瑜珈的熊貓", "想當忍者的烏龜", "偷吃起司的老鼠", "戴假髮的禿頭鷹", "正在減肥的豬八戒",
    "正在拔河的蚯蚓", "怕高的長頸鹿", "不會游泳的魚", "正在刮鬍子的聖誕老公公"
];

// --- Drawing Component ---
const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight; 
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
  }, []);

  useEffect(() => {
      const canvas = canvasRef.current;
      if(canvas) {
          const ctx = canvas.getContext('2d');
          ctx.lineWidth = lineWidth;
      }
  }, [lineWidth]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    if(e.type === 'touchstart') e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if(e.type === 'touchmove') e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-grow relative bg-white border-2 border-slate-300 rounded-lg overflow-hidden touch-none shadow-inner cursor-crosshair">
        <canvas ref={canvasRef} className="w-full h-full block"
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} id="drawing-canvas" />
      </div>
      <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
        <div className="flex gap-2">
          {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'].map(c => (
            <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 ${color === c ? 'border-slate-800 scale-110' : 'border-white'} shadow transition-transform`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex gap-2 items-center">
            <input type="range" min="1" max="10" value={lineWidth} onChange={(e)=>setLineWidth(e.target.value)} className="w-20" />
            <button onClick={clearCanvas} className="text-xs text-slate-500 hover:text-red-500 font-medium px-2 py-1 bg-slate-100 rounded">清除</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---
export default function App() {
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, WAITING_ROOM, PLAYING, FINISHED
  const [roomData, setRoomData] = useState(null);
  const [currentTask, setCurrentTask] = useState(null); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // 1. Config Check
  if (!isConfigValid) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl border border-red-500 text-white max-w-md">
          <h2 className="text-xl font-bold mb-4 text-red-400">尚未設定資料庫</h2>
          <p className="text-slate-300 mb-4">請在程式碼最上方的 <code>MANUAL_CONFIG</code> 區塊填入您的 Firebase 設定，才能啟用多人連線功能。</p>
        </div>
      </div>
    );
  }

  // 2. Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) { console.error(err); setError("認證失敗：請檢查 Firebase Auth 設定"); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 3. URL Params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) setRoomId(params.get('room').toUpperCase());
  }, []);

  // 4. Room Listener
  useEffect(() => {
    if (!user || !roomId || gameState === 'LOBBY') return;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${roomId}`);
    return onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        if (data.status === 'PLAYING' && gameState === 'WAITING_ROOM') setGameState('PLAYING');
        else if (data.status === 'FINISHED') setGameState('FINISHED');
      } else { setError('房間不存在'); setGameState('LOBBY'); }
    }, (err) => {
        console.error(err);
        if(err.code === 'permission-denied') setError("權限不足：請檢查 Firestore Rules");
        else setError("連線中斷");
    });
  }, [user, roomId, gameState]);

  // 5. Core Game Logic (Round Robin & Odd/Even Rule)
  useEffect(() => {
    if (gameState !== 'PLAYING' || !roomData || !user) return;

    const myIndex = roomData.players.findIndex(p => p.uid === user.uid);
    if (myIndex === -1) return;

    const playerCount = roomData.players.length;
    const round = roomData.round || 0;
    const isEven = playerCount % 2 === 0;

    // --- 關鍵規則邏輯 ---
    // PassAmount: 這本書相對於 Owner 移動了幾格 (向左傳幾次)
    let passAmount = 0;
    if (round === 0) {
        passAmount = 0; // Round 0 (設定題目): 永遠在 Owner 手上
    } else {
        if (isEven) {
            // 雙數玩家：Round 1 自己畫 (0 pass), Round 2 傳左 (1 pass)
            passAmount = round - 1; 
        } else {
            // 單數玩家：Round 1 傳左 (1 pass), Round 2 再傳 (2 pass)
            passAmount = round;
        }
    }

    // 計算「現在我手上拿的是誰的書」
    // 如果 PassAmount = 1，代表我(Index 1)拿的是(Index 0)的書
    // 公式：OwnerIndex = (MyIndex - PassAmount) % N
    const ownerIndex = (myIndex - passAmount + 100 * playerCount) % playerCount;
    const currentBookOwner = roomData.players[ownerIndex];

    const fetchBook = async () => {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', `room_${roomId}_book_${currentBookOwner.uid}`);
      const bookSnap = await getDoc(bookRef);
      
      if (bookSnap.exists()) {
        const book = bookSnap.data();
        
        // 判斷是否已完成本回合
        // Round 0 (Write): 完成後 pages.length = 1
        // Round N: 完成後 pages.length = N + 1
        // 例外：雙數玩家 Round 1 (Draw Own)，此時 pages.length 會變成 2
        // 單數玩家 Round 1 (Draw Other)，此時 pages.length 也會變成 2
        // 所以通用規則是：如果 pages.length == round + 1，代表已完成
        
        if (round === 0) {
            if (book.pages.length > 0) setCurrentTask({ type: 'wait' });
            else setCurrentTask({ type: 'word_init' });
        } else {
            if (book.pages.length > round) {
                setCurrentTask({ type: 'wait' });
            } else {
                // 還沒完成
                const prevPage = book.pages[round - 1];
                const taskType = prevPage.type === 'word' ? 'draw' : 'guess';
                const isMyOwnBook = currentBookOwner.uid === user.uid;
                
                setCurrentTask({
                    type: taskType,
                    prevContent: prevPage.content,
                    bookOwnerId: currentBookOwner.uid,
                    bookOwnerName: currentBookOwner.name,
                    isMyOwnBook: isMyOwnBook,
                    roundIndex: round
                });
            }
        }
      } else {
          // 容錯
          if (round === 0) setCurrentTask({ type: 'word_init' });
      }
    };

    fetchBook();
  }, [gameState, roomData, user, roomId]);

  // --- Actions ---
  const copyToClipboard = (text, type) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.opacity = "0";
    document.body.appendChild(textArea); textArea.focus(); textArea.select();
    try { if (document.execCommand('copy')) { setCopySuccess(type); setTimeout(() => setCopySuccess(''), 2000); } } catch (err) {}
    document.body.removeChild(textArea);
  };

  const createRoom = async () => {
    if (!playerName.trim()) return alert('請輸入暱稱');
    setLoading(true);
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${newRoomId}`);
    try {
      await setDoc(roomRef, { roomId: newRoomId, hostId: user.uid, status: 'WAITING', round: 0, players: [{ uid: user.uid, name: playerName }], createdAt: serverTimestamp() });
      setRoomId(newRoomId); setGameState('WAITING_ROOM');
    } catch (e) { console.error(e); alert('建立失敗'); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) return alert('資料不完整');
    setLoading(true);
    const safeRoomId = roomId.trim().toUpperCase();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${safeRoomId}`);
    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw "房間不存在";
        if (roomDoc.data().status !== 'WAITING') throw "遊戲已開始";
        const players = roomDoc.data().players || [];
        if (!players.find(p => p.uid === user.uid)) {
            if (players.length >= 8) throw "房間已滿 (最多8人)";
            transaction.update(roomRef, { players: arrayUnion({ uid: user.uid, name: playerName }) });
        }
      });
      setRoomId(safeRoomId); setGameState('WAITING_ROOM');
    } catch (e) { alert(e); }
    setLoading(false);
  };

  const startGame = async () => {
    const pCount = roomData.players.length;
    if (pCount < 3) return alert("至少需要 3 人才能開始"); // Prompt Requirement
    if (pCount > 8) return alert("最多只能 8 人"); // Prompt Requirement

    const batchPromises = roomData.players.map(p => 
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', `room_${roomId}_book_${p.uid}`), { ownerId: p.uid, ownerName: p.name, pages: [] })
    );
    await Promise.all(batchPromises);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${roomId}`), {
        status: 'PLAYING', round: 0
    });
  };

  const submitPage = async (content, type) => {
    setLoading(true);
    const myIndex = roomData.players.findIndex(p => p.uid === user.uid);
    const playerCount = roomData.players.length;
    const round = roomData.round;
    const isEven = playerCount % 2 === 0;
    
    let passAmount = 0;
    if (round === 0) passAmount = 0;
    else passAmount = isEven ? round - 1 : round;

    const ownerIndex = (myIndex - passAmount + 100 * playerCount) % playerCount;
    const currentBookOwner = roomData.players[ownerIndex];
    
    const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', `room_${roomId}_book_${currentBookOwner.uid}`);
    setCurrentTask({ type: 'wait' }); 
    
    await updateDoc(bookRef, {
        pages: arrayUnion({ type, content, authorUid: user.uid, authorName: roomData.players.find(p => p.uid === user.uid).name })
    });
    checkRoundCompletion(round, playerCount, isEven);
    setLoading(false);
  };

  const checkRoundCompletion = async (currentRound, playerCount, isEven) => {
    const promises = roomData.players.map(p => getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', `room_${roomId}_book_${p.uid}`)));
    const snapshots = await Promise.all(promises);
    const allDone = snapshots.every(s => s.data().pages.length === currentRound + 1);
    
    if (allDone) {
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${roomId}`);
        const nextRound = currentRound + 1;
        
        // --- 遊戲結束判定 ---
        // 我們要檢查下一回合的 passAmount 是否等於 playerCount (代表傳回自己手上了)
        // Even: Sequence 0, 0, 1, 2, 3... -> End when passAmount == playerCount (i.e. round-1 == N)
        // Odd: Sequence 0, 1, 2, 3... -> End when passAmount == playerCount (i.e. round == N)
        
        let nextPassAmount = 0;
        if (isEven) nextPassAmount = nextRound - 1;
        else nextPassAmount = nextRound;

        if (nextPassAmount >= playerCount) {
             await updateDoc(roomRef, { status: 'FINISHED' });
        } else {
             await updateDoc(roomRef, { round: nextRound });
        }
    }
  };

  const generateAIWord = () => {
      const random = AI_TOPICS[Math.floor(Math.random() * AI_TOPICS.length)];
      const input = document.getElementById('wordInput');
      if(input) input.value = random;
  };

  // --- Views ---
  const renderLobby = () => (
    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">傳情畫意 Online</h1>
      <p className="text-center text-slate-500 mb-8 text-sm">支援 3-8 人 • 奇偶數規則自動切換</p>
      {error && <div className="mb-4 p-2 bg-red-100 text-red-600 rounded text-sm">{error}</div>}
      <div className="space-y-4">
        <div><label className="text-sm font-bold text-slate-700">你的暱稱</label><input type="text" value={playerName} onChange={e=>setPlayerName(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="例如：小畫家" /></div>
        <button onClick={createRoom} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">{loading?<Loader2 className="animate-spin"/>:<PenTool/>} 建立房間</button>
        <div className="flex gap-2"><input type="text" value={roomId} onChange={e=>setRoomId(e.target.value.toUpperCase())} className="flex-grow p-3 border rounded-lg text-center uppercase" placeholder="輸入房間 ID" /><button onClick={joinRoom} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 rounded-lg">加入</button></div>
      </div>
    </div>
  );

  const renderWaitingRoom = () => (
    <div className="max-w-2xl w-full bg-white p-6 rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-slate-700">等待其他玩家...</h2>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-flex items-center gap-4 border border-blue-200">
            <div className="text-left"><p className="text-xs text-blue-500 font-bold">房間 ID</p><p className="text-2xl font-mono font-bold text-blue-800">{roomId}</p></div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={()=>copyToClipboard(roomId, 'ID')} className="p-2 hover:bg-blue-100 rounded-full text-blue-600 relative">{copySuccess==='ID'?<Check size={20}/>:<Share2 size={20}/>}</button>
              <button onClick={()=>copyToClipboard(`${window.location.origin}${window.location.pathname}?room=${roomId}`, 'LINK')} className="p-2 hover:bg-blue-100 rounded-full text-blue-600 relative">{copySuccess==='LINK'?<Check size={20}/>:<Link size={20}/>}</button>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {roomData?.players?.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">{p.name[0]}</div>
                  <span className="truncate w-full text-center text-sm font-medium">{p.name}</span>
                  {p.uid===roomData.hostId&&<span className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-[10px] px-1 rounded font-bold">HOST</span>}
              </div>
          ))}
          {Array.from({length: Math.max(0, 8-(roomData?.players?.length||0))}).map((_,i)=><div key={`e-${i}`} className="p-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-300 flex items-center justify-center text-xs">等待加入...</div>)}
      </div>
      
      <div className="text-center text-sm text-slate-500 mb-4">
          目前人數: {roomData?.players?.length} / 8 (最少 3 人)
      </div>

      {user.uid===roomData?.hostId ? 
          <button onClick={startGame} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg ${roomData?.players?.length<3?'bg-slate-300 cursor-not-allowed':'bg-green-500 hover:bg-green-600 text-white'}`}>
            {roomData?.players?.length<3 ? `還差 ${3-roomData.players.length} 人` : '開始遊戲！'}
          </button>
      : <div className="text-center text-slate-500 animate-pulse bg-slate-100 py-3 rounded-lg">等待房主開始遊戲...</div>}
    </div>
  );

  const renderGame = () => {
      if (!currentTask) return <div className="text-white"><Loader2 className="animate-spin"/> 載入中...</div>;
      if (currentTask.type === 'wait') return <div className="text-center text-white p-8"><div className="text-6xl mb-4 animate-bounce">☕</div><h2 className="text-2xl font-bold">已完成！</h2><p className="opacity-80">請稍等其他玩家...</p></div>;
      
      if (currentTask.type === 'word_init') return (
        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h2 className="text-xl font-bold text-center mb-1 text-purple-600">第一回合：設定題目</h2>
            <p className="text-center text-slate-500 text-sm mb-4">這會是你這本畫冊的主題喔！</p>
            <div className="flex gap-2 mb-4">
                <input type="text" id="wordInput" className="flex-grow text-center text-xl p-3 border-2 border-purple-200 rounded-xl outline-none focus:border-purple-500" placeholder="例如：會飛的豬" />
                <button onClick={generateAIWord} className="bg-purple-100 text-purple-600 px-3 rounded-xl font-bold flex flex-col items-center justify-center text-xs hover:bg-purple-200 border-2 border-purple-200 transition-colors"><Sparkles size={16}/><span>AI出題</span></button>
            </div>
            <button onClick={()=>{const val=document.getElementById('wordInput').value.trim();if(val)submitPage(val,'word')}} className="w-full bg-purple-500 text-white py-3 rounded-lg font-bold hover:bg-purple-600 shadow-lg">確定題目</button>
        </div>
      );

      // Guess Phase
      if (currentTask.type === 'guess') return (
        <div className="bg-white p-4 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-4 flex justify-between items-center px-4">
                <span className="font-bold flex items-center gap-2"><User size={16}/> {currentTask.bookOwnerName} 的畫本</span>
                <span className="text-xs bg-yellow-200 px-2 py-1 rounded">猜題階段</span>
            </div>
            <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50 mb-4 shadow-inner relative group">
                <img src={currentTask.prevContent} className="w-full h-auto object-contain max-h-[50vh]"/>
                <div className="absolute bottom-2 right-2 opacity-50 text-xs text-slate-400">上一位玩家的傑作</div>
            </div>
            <input type="text" id="guessInput" className="w-full text-center text-xl p-3 border-2 border-blue-200 rounded-lg mb-2 focus:border-blue-500 outline-none" placeholder="你覺得這是什麼？" />
            <button onClick={()=>{const val=document.getElementById('guessInput').value.trim();if(val)submitPage(val,'word')}} className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 shadow">送出答案</button>
        </div>
      );

      // Draw Phase
      if (currentTask.type === 'draw') return (
        <div className="bg-white p-4 rounded-xl shadow-2xl max-w-3xl w-full h-[85vh] flex flex-col">
            <div className={`p-3 rounded mb-2 flex justify-between items-center ${currentTask.isMyOwnBook ? 'bg-indigo-100 text-indigo-900' : 'bg-green-100 text-green-900'}`}>
                <span className="font-bold flex items-center gap-2">
                    {currentTask.isMyOwnBook && <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded shadow">你的題目</span>}
                    <span className="text-slate-600 text-sm">請畫出：</span>
                    <span className="text-2xl font-black">{currentTask.prevContent}</span>
                </span>
                <span className="text-xs opacity-70">Round {currentTask.roundIndex + 1}</span>
            </div>
            <div className="flex-grow min-h-0 mb-4 shadow-inner rounded-lg border-2 border-slate-200 overflow-hidden"><DrawingCanvas /></div>
            <button onClick={()=>{const cvs=document.getElementById('drawing-canvas');submitPage(cvs.toDataURL('image/jpeg',0.6),'image')}} className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 shadow-lg text-lg">畫好了！傳給下一位</button>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans select-none">
      {!user && <div className="text-white flex flex-col items-center gap-2"><Loader2 className="animate-spin" size={32}/><span>連線到伺服器中...</span></div>}
      {user && gameState === 'LOBBY' && renderLobby()}
      {user && gameState === 'WAITING_ROOM' && renderWaitingRoom()}
      {user && gameState === 'PLAYING' && renderGame()}
      {user && gameState === 'FINISHED' && <GalleryView roomId={roomId} players={roomData.players} onReset={()=>setGameState('LOBBY')} />}
    </div>
  );
}

const GalleryView = ({ roomId, players, onReset }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchAllBooks = async () => {
            const promises = players.map(p => getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', `room_${roomId}_book_${p.uid}`)));
            const snaps = await Promise.all(promises);
            setBooks(snaps.map(s => s.data()));
            setLoading(false);
        };
        fetchAllBooks();
    }, [roomId, players]);
    
    if(loading) return <div className="text-white flex items-center gap-2"><Loader2 className="animate-spin"/> 整理結果中...</div>;
    
    return (
        <div className="w-full max-w-6xl h-[90vh] bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700">
            <header className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-2"><Play className="text-green-500" fill="currentColor"/><h2 className="text-2xl font-bold text-white">遊戲結果展示</h2></div>
                <button onClick={onReset} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors">回到大廳</button>
            </header>
            <div className="flex-grow overflow-y-auto p-6 space-y-12 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {books.map((book, bIdx) => (
                    <div key={bIdx} className="bg-slate-700/50 rounded-xl p-6 shadow-xl border border-slate-600">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold">{book.ownerName[0]}</div>
                            <h3 className="text-xl font-bold text-slate-200">{book.ownerName} 的畫本</h3>
                            <span className="ml-auto text-slate-500 text-sm">題目：{book.pages[0]?.content}</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-thin scrollbar-thumb-slate-500">
                            {book.pages.map((page, pIdx) => (
                                <div key={pIdx} className="flex-none w-64 snap-center group">
                                    <div className={`rounded-t-lg p-2 text-xs font-bold flex justify-between items-center ${page.type==='word'?'bg-blue-900/50 text-blue-200':'bg-green-900/50 text-green-200'}`}>
                                        <span className="uppercase tracking-wider">{pIdx===0?'題目':`Round ${pIdx}`}</span>
                                        <span className="flex items-center gap-1"><User size={10}/> {page.authorName}</span>
                                    </div>
                                    <div className="bg-white h-48 rounded-b-lg flex items-center justify-center overflow-hidden border-2 border-t-0 border-slate-600/50 group-hover:border-slate-500 transition-colors relative">
                                        {page.type === 'word' ? 
                                            <p className="text-2xl font-black text-slate-800 px-4 text-center leading-tight">{page.content}</p> : 
                                            <img src={page.content} className="w-full h-full object-contain" />
                                        }
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-[10px] px-1 rounded">
                                            {page.type==='word'?'文字':'繪圖'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};