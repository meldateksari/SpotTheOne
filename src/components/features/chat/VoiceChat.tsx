import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { Player, RoomData } from "@/types";
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase.client";
import { useLanguage } from "@/context/LanguageContext";

interface VoiceChatProps {
    roomId: string;
    currentUser: Player;
    players: Player[];
    hostId?: string;
    voiceParticipants?: string[];
}

export default function VoiceChat({ roomId, currentUser, players, voiceParticipants = [], hostId }: VoiceChatProps) {
    const { t } = useLanguage();

    // State
    const [isInVoice, setIsInVoice] = useState(false);

    const [isConnecting, setIsConnecting] = useState(false); // New state for connection feedback
    const [peer, setPeer] = useState<Peer | null>(null);
    const [myPeerId, setMyPeerId] = useState<string | null>(null);

    const [isMuted, setIsMuted] = useState(true); // Default muted
    const [isDeafened, setIsDeafened] = useState(false);
    const [mutedPeers, setMutedPeers] = useState<Set<string>>(new Set());

    const [isExpanded, setIsExpanded] = useState(false);

    // Audio Levels for Visualizer
    const [audioLevels, setAudioLevels] = useState<{ [key: string]: number }>({});

    // Refs
    const myStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<{ [key: string]: any }>({}); // Active calls
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({}); // Audio elements
    const audioContextRef = useRef<AudioContext | null>(null);
    const analysersRef = useRef<{ [key: string]: AnalyserNode }>({});
    const animationFrameRef = useRef<number | null>(null);
    const peerRef = useRef<Peer | null>(null);
    const isInVoiceRef = useRef(false);

    // ===========================================================
    // JOIN / LEAVE LOGIC
    // ===========================================================
    const joinVoice = async () => {
        try {
            setIsConnecting(true); // Start loading
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            myStreamRef.current = stream;

            // Default Mute
            stream.getAudioTracks().forEach(track => track.enabled = false);
            setIsMuted(true);

            // Setup Audio Context for Self Visualizer
            setupAudioAnalysis(currentUser.id, stream);

            const localPeer = new Peer({
                config: {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:stun1.l.google.com:19302" },
                        { urls: "stun:stun2.l.google.com:19302" },
                        { urls: "stun:stun3.l.google.com:19302" },
                        { urls: "stun:stun4.l.google.com:19302" },
                    ],
                },
            });

            localPeer.on("open", async (id) => {
                console.log("My Peer ID:", id);
                setMyPeerId(id);
                setPeer(localPeer);
                peerRef.current = localPeer;
                setIsInVoice(true);
                isInVoiceRef.current = true;
                setIsConnecting(false); // Stop loading

                // Update Firestore: Add me to voiceParticipants AND save my peerId AND set initial mute state
                await updateRoomData(id, true, true); // Default isMuted = true
            });

            localPeer.on("call", (call) => {
                console.log("Incoming call from:", call.peer);
                call.answer(stream);
                call.on("stream", (remoteStream) => {
                    addAudioStream(call.peer, remoteStream);
                    // We need to find the participant ID for this peer ID to setup visualizer
                    // This is tricky because we don't have a direct map here easily without iterating players
                    // But we can do it in the loop or find it here.
                    // Let's rely on the useEffect below to setup visualizer for known peers?
                    // Actually, useEffect handles OUTGOING calls. Incoming calls need handling here.
                    // We can find the player by peerId
                    const caller = players.find(p => p.peerId === call.peer);
                    if (caller) {
                        setupAudioAnalysis(caller.id, remoteStream);
                    }
                });
            });

            localPeer.on("error", (err) => {
                console.error("Peer error:", err);
                setIsConnecting(false);
                alert("Connection error. Please try again.");
            });

        } catch (err) {
            console.error("Failed to join voice:", err);
            setIsConnecting(false);
            alert("Microphone access denied or error occurred.");
        }
    };

    const leaveVoice = async () => {
        if (peer) peer.destroy();
        if (myStreamRef.current) {
            myStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Cleanup state
        setPeer(null);
        peerRef.current = null;
        setMyPeerId(null);
        setIsInVoice(false);
        isInVoiceRef.current = false;
        setIsConnecting(false);
        myStreamRef.current = null;
        peersRef.current = {};

        // Cleanup audio
        Object.values(audioRefs.current).forEach(audio => {
            audio.pause();
            audio.srcObject = null;
        });
        audioRefs.current = {};

        // Cleanup Audio Context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analysersRef.current = {};
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setAudioLevels({}); // Reset levels

        // Update Firestore
        await updateRoomData(null, false, false);
    };

    const updateRoomData = async (peerId: string | null, joining: boolean, muted: boolean = false) => {
        const roomRef = doc(db, "rooms", roomId);
        try {
            await updateDoc(roomRef, {
                voiceParticipants: joining ? arrayUnion(currentUser.id) : arrayRemove(currentUser.id)
            });

            if (joining && peerId) {
                const snap = await getDoc(roomRef);
                if (snap.exists()) {
                    const data = snap.data() as RoomData;
                    const updatedPlayers = data.players.map(p =>
                        p.id === currentUser.id ? { ...p, peerId, isMuted: muted } : p
                    );
                    await updateDoc(roomRef, { players: updatedPlayers });
                }
            }
        } catch (err) {
            console.error("Error updating room data:", err);
        }
    };

    const updateMuteStatus = async (muted: boolean) => {
        const roomRef = doc(db, "rooms", roomId);
        try {
            const snap = await getDoc(roomRef);
            if (snap.exists()) {
                const data = snap.data() as RoomData;
                const updatedPlayers = data.players.map(p =>
                    p.id === currentUser.id ? { ...p, isMuted: muted } : p
                );
                await updateDoc(roomRef, { players: updatedPlayers });
            }
        } catch (err) {
            console.error("Error updating mute status:", err);
        }
    };

    // ===========================================================
    // AUDIO ANALYSIS (VISUALIZER)
    // ===========================================================
    const setupAudioAnalysis = (id: string, stream: MediaStream) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;

        // Resume context if suspended (browser policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Check if we already have an analyser for this ID to avoid duplicates
        if (analysersRef.current[id]) return;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64; // Increased slightly for better resolution
        analyser.smoothingTimeConstant = 0.5; // Smooth out the animation
        source.connect(analyser);

        analysersRef.current[id] = analyser;

        if (!animationFrameRef.current) {
            animateLevels();
        }
    };

    const animateLevels = () => {
        const levels: { [key: string]: number } = {};

        Object.entries(analysersRef.current).forEach(([id, analyser]) => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);

            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            levels[id] = average;
        });

        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(animateLevels);
    };

    // ===========================================================
    // CONNECTION LOGIC
    // ===========================================================
    useEffect(() => {
        if (!peer || !myPeerId || !myStreamRef.current || !isInVoice) return;

        voiceParticipants.forEach(participantId => {
            if (participantId === currentUser.id) return;

            const participant = players.find(p => p.id === participantId);
            if (participant && participant.peerId && !peersRef.current[participant.peerId]) {
                console.log("Calling:", participant.name);
                const call = peer.call(participant.peerId, myStreamRef.current!);

                call.on("stream", (remoteStream) => {
                    addAudioStream(participant.peerId!, remoteStream);
                    setupAudioAnalysis(participant.id, remoteStream);
                });

                peersRef.current[participant.peerId] = call;
            }
        });

    }, [voiceParticipants, players, peer, myPeerId, isInVoice]);

    // ===========================================================
    // CLEANUP ON UNMOUNT
    // ===========================================================
    useEffect(() => {
        return () => {
            if (isInVoiceRef.current) {
                console.log("Cleaning up voice connection on unmount...");

                // Destroy Peer
                if (peerRef.current) {
                    peerRef.current.destroy();
                    peerRef.current = null;
                }

                // Stop Stream
                if (myStreamRef.current) {
                    myStreamRef.current.getTracks().forEach(track => track.stop());
                    myStreamRef.current = null;
                }

                // Cleanup Audio Context
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }

                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }

                // Remove from Firestore
                // Note: We use the captured props here. If roomId changed, this cleanup runs for the OLD roomId.
                updateRoomData(null, false);
            }
        };
    }, [roomId, currentUser.id]); // Re-run cleanup if room or user changes

    const addAudioStream = (peerId: string, stream: MediaStream) => {
        if (!audioRefs.current[peerId]) {
            const audio = new Audio();
            audio.srcObject = stream;
            audio.autoplay = true;
            audioRefs.current[peerId] = audio;
        }
    };

    // ===========================================================
    // MUTE / DEAFEN LOGIC
    // ===========================================================
    const toggleMuteSelf = () => {
        if (myStreamRef.current) {
            myStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
            updateMuteStatus(!isMuted);
        }
    };

    const toggleDeafen = () => {
        const newDeafenState = !isDeafened;
        setIsDeafened(newDeafenState);
        Object.values(audioRefs.current).forEach(audio => {
            audio.muted = newDeafenState || false;
        });
        if (!newDeafenState) {
            Object.entries(audioRefs.current).forEach(([pid, audio]) => {
                if (mutedPeers.has(pid)) audio.muted = true;
                else audio.muted = false;
            });
        }
    };

    const toggleMutePeer = (targetPeerId: string) => {
        const newSet = new Set(mutedPeers);
        if (newSet.has(targetPeerId)) {
            newSet.delete(targetPeerId);
            if (audioRefs.current[targetPeerId] && !isDeafened) {
                audioRefs.current[targetPeerId].muted = false;
            }
        } else {
            newSet.add(targetPeerId);
            if (audioRefs.current[targetPeerId]) {
                audioRefs.current[targetPeerId].muted = true;
            }
        }
        setMutedPeers(newSet);
    };

    // ===========================================================
    // UI
    // ===========================================================

    return (
        <div className="fixed z-40 flex gap-2 top-28 right-4 flex-col items-end sm:top-auto sm:right-auto sm:bottom-4 sm:left-4 sm:flex-col-reverse sm:items-start">

            {/* Main Control Button (Toggle Panel) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center justify-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full shadow-lg transition-all ${isExpanded ? "bg-white text-black border-2 border-black" : "bg-black text-white"
                    }`}
            >
                <span className="material-symbols-outlined">
                    {isExpanded ? "expand_more" : "graphic_eq"}
                </span>
                <span className="uppercase tracking-widest text-xs font-bold hidden sm:inline">
                    {t("voiceRoom")}
                </span>
                <span className="text-xs font-bold">
                    ({voiceParticipants.length})
                </span>
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="bg-white border-2 border-black rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 fade-in duration-200">

                    {/* Header / My Controls */}
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        {isInVoice ? (
                            <>
                                <div className="flex gap-2">
                                    <button
                                        onClick={toggleMuteSelf}
                                        className={`p-2 rounded-full transition-colors ${isMuted ? "bg-red-100 text-red-600" : "bg-gray-100 text-black hover:bg-gray-200"}`}
                                        title={isMuted ? t("unmute") : t("mute")}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {isMuted ? "mic_off" : "mic"}
                                        </span>
                                    </button>
                                    <button
                                        onClick={toggleDeafen}
                                        className={`p-2 rounded-full transition-colors ${isDeafened ? "bg-red-100 text-red-600" : "bg-gray-100 text-black hover:bg-gray-200"}`}
                                        title={isDeafened ? t("undeafen") : t("deafen")}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {isDeafened ? "headset_off" : "headset"}
                                        </span>
                                    </button>
                                </div>

                                <button
                                    onClick={leaveVoice}
                                    className="text-red-600 text-xs font-bold uppercase tracking-widest hover:underline"
                                >
                                    {t("leaveVoice")}
                                </button>
                            </>
                        ) : (
                            <div className="w-full flex justify-center">
                                <button
                                    onClick={joinVoice}
                                    disabled={isConnecting}
                                    className="bg-black text-white w-full py-2 rounded-lg uppercase tracking-widest text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isConnecting ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Connecting...
                                        </>
                                    ) : (
                                        t("joinVoice")
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Participants List */}
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {voiceParticipants.map(pid => {
                            const p = players.find(pl => pl.id === pid);
                            if (!p) return null;
                            const isMe = p.id === currentUser.id;
                            const isPeerMuted = p.peerId ? mutedPeers.has(p.peerId) : false;

                            // Audio Level (0-255)
                            const level = audioLevels[pid] || 0;
                            // Fix: Don't show speaking indicator if deafened or muted
                            const isSpeaking = level > 5 && (isMe ? !isMuted : (!isDeafened && !isPeerMuted));

                            return (
                                <div key={pid} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ${isSpeaking ? "ring-2 ring-green-500" : ""}`}>
                                            <img src={`/animals/${p.avatar}`} className="w-full h-full rounded-full bg-gray-100 object-cover" />
                                            {/* Waveform Animation Overlay */}
                                            {isSpeaking && (
                                                <div className="absolute inset-0 flex items-center justify-center gap-[2px] bg-black/20 rounded-full">
                                                    <div className="w-[2px] bg-green-400 animate-pulse h-3"></div>
                                                    <div className="w-[2px] bg-green-400 animate-pulse h-5 delay-75"></div>
                                                    <div className="w-[2px] bg-green-400 animate-pulse h-3 delay-150"></div>
                                                </div>
                                            )}
                                        </div>

                                        <span className="truncate font-medium flex items-center gap-1 max-w-[100px]">
                                            {isMe ? `${t("you")}` : p.name}
                                            {p.id === hostId && (
                                                <span className="material-symbols-outlined text-[14px] text-yellow-600" title={t("hostLabel")}>
                                                    crown
                                                </span>
                                            )}
                                            {/* Mute Indicator */}
                                            {p.isMuted && (
                                                <span className="material-symbols-outlined text-[16px] text-red-500" title={t("muted")}>
                                                    mic_off
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    {
                                        isInVoice && !isMe && p.peerId && (
                                            <button
                                                onClick={() => toggleMutePeer(p.peerId!)}
                                                className={`text-gray-400 hover:text-black ${isPeerMuted ? "text-red-500" : ""}`}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {isPeerMuted ? "volume_off" : "volume_up"}
                                                </span>
                                            </button>
                                        )
                                    }
                                </div>
                            );
                        })}

                        {voiceParticipants.length === 0 && (
                            <p className="text-gray-400 text-xs text-center py-2">{t("emptyRoom")}</p>
                        )}
                    </div>

                </div>
            )
            }

        </div >
    );
}
