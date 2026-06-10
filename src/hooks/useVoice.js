import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export function useVoice(channelId) {
  const { on, emit, user } = useApp();
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [error, setError] = useState(null);

  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const audioElsRef = useRef(new Map());
  const joiningRef = useRef(false);

  const createPeer = useCallback((remoteUserId, initiator) => {
    if (peersRef.current.has(remoteUserId)) return peersRef.current.get(remoteUserId);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(remoteUserId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        emit('voice:signal', { channelId, targetUserId: remoteUserId, signal: { candidate: e.candidate } });
      }
    };

    pc.ontrack = (e) => {
      let audio = audioElsRef.current.get(remoteUserId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audioElsRef.current.set(remoteUserId, audio);
      }
      audio.srcObject = e.streams[0];
      if (deafened) audio.muted = true;
    };

    if (initiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        emit('voice:signal', { channelId, targetUserId: remoteUserId, signal: { sdp: offer } });
      });
    }

    return pc;
  }, [channelId, emit, deafened]);

  const handleSignal = useCallback(async (fromUserId, signal) => {
    let pc = peersRef.current.get(fromUserId);
    if (!pc) pc = createPeer(fromUserId, false);

    if (signal.sdp) {
      await pc.setRemoteDescription(signal.sdp);
      if (signal.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit('voice:signal', { channelId, targetUserId: fromUserId, signal: { sdp: answer } });
      }
    } else if (signal.candidate) {
      await pc.addIceCandidate(signal.candidate);
    }
  }, [channelId, createPeer, emit]);

  const join = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      joiningRef.current = true;
      emit('voice:join', { channelId });
      setConnected(true);
    } catch (err) {
      setError('Microphone access denied or unavailable');
    }
  }, [channelId, emit]);

  const leave = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    audioElsRef.current.forEach(a => { a.srcObject = null; });
    audioElsRef.current.clear();
    emit('voice:leave');
    setConnected(false);
    setParticipants([]);
    setMuted(false);
    setDeafened(false);
  }, [emit]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
    setMuted(next);
    emit('voice:mute', { muted: next });
  }, [muted, emit]);

  const toggleDeafen = useCallback(() => {
    const next = !deafened;
    audioElsRef.current.forEach(a => { a.muted = next; });
    setDeafened(next);
    emit('voice:deafen', { deafened: next });
    if (next && !muted) {
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
      setMuted(true);
      emit('voice:mute', { muted: true });
    }
  }, [deafened, muted, emit]);

  useEffect(() => {
    if (!channelId) return;

    const unsubs = [
      on('voice:participants', setParticipants),
      on('voice:signal', ({ fromUserId, signal }) => {
        if (fromUserId !== user?.id) handleSignal(fromUserId, signal);
      }),
    ];

    return () => unsubs.forEach(fn => fn?.());
  }, [channelId, on, user, handleSignal]);

  useEffect(() => {
    if (!connected || !user || !joiningRef.current) return;
    participants.forEach(p => {
      if (p.userId !== user.id && !peersRef.current.has(p.userId)) {
        createPeer(p.userId, true);
      }
    });
    joiningRef.current = false;
  }, [participants, connected, user, createPeer]);

  useEffect(() => {
    return () => leave();
  }, [channelId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    participants, connected, muted, deafened, error,
    join, leave, toggleMute, toggleDeafen,
  };
}
