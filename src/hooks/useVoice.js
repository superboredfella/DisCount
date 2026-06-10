import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { waitForSocketAuth } from './useSocket';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export function useVoice(channelId) {
  const { on, emit, user } = useApp();
  const [participants, setParticipants] = useState([]);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [error, setError] = useState(null);

  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const audioElsRef = useRef(new Map());
  const joiningRef = useRef(false);
  
  // Storage for early ICE candidates that arrive before the SDP offer/answer is processed
  const candidateQueuesRef = useRef(new Map());

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

    try {
      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        if (signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          emit('voice:signal', { channelId, targetUserId: fromUserId, signal: { sdp: answer } });
        }

        // Process any ICE candidates that arrived too early for this peer
        const queue = candidateQueuesRef.current.get(fromUserId) || [];
        while (queue.length > 0) {
          const cand = queue.shift();
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
        candidateQueuesRef.current.delete(fromUserId);

      } else if (signal.candidate) {
        // Safe check to prevent DOMException crashes if SDP hasn't settled yet
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          if (!candidateQueuesRef.current.has(fromUserId)) {
            candidateQueuesRef.current.set(fromUserId, []);
          }
          candidateQueuesRef.current.get(fromUserId).push(signal.candidate);
        }
      }
    } catch (err) {
      console.error("Failed to handle WebRTC signaling securely:", err);
    }
  }, [channelId, createPeer, emit]);

  const cleanupMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    audioElsRef.current.forEach(a => { a.srcObject = null; });
    audioElsRef.current.clear();
    candidateQueuesRef.current.clear();
  }, []);

  const join = useCallback(async () => {
    if (!channelId || joiningRef.current) return;
    setError(null);
    joiningRef.current = true;
    try {
      await waitForSocketAuth();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      emit('voice:join', { channelId });
      setConnected(true);
      setJoined(true);
    } catch (err) {
      joiningRef.current = false;
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        setError('Microphone access denied or unavailable');
      } else {
        setError('Could not connect to voice');
      }
    }
  }, [channelId, emit]);

  const leave = useCallback(() => {
    cleanupMedia();
    emit('voice:leave');
    setConnected(false);
    setJoined(false);
    setParticipants([]);
    setMuted(false);
    setDeafened(false);
    joiningRef.current = false;
  }, [cleanupMedia, emit]);

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

  // Safe explicitly checked subscription hook to avoid minification execution errors
  useEffect(() => {
    if (!channelId) return;

    const unsubParticipants = on('voice:participants', (list) => {
      setParticipants(list);
      if (list.length > 0) joiningRef.current = false;
    });

    const unsubSignal = on('voice:signal', ({ fromUserId, signal }) => {
      if (fromUserId !== user?.id) handleSignal(fromUserId, signal);
    });

    return () => {
      if (typeof unsubParticipants === 'function') unsubParticipants();
      if (typeof unsubSignal === 'function') unsubSignal();
    };
  }, [channelId, on, user, handleSignal]);

  useEffect(() => {
    if (!connected || !user || !joiningRef.current) return;
    participants.forEach(p => {
      if (p.userId !== user.id && !peersRef.current.has(p.userId)) {
        createPeer(p.userId, true);
      }
    });
    if (participants.some(p => p.userId === user.id)) {
      joiningRef.current = false;
    }
  }, [participants, connected, user, createPeer]);

  useEffect(() => {
    return () => {
      cleanupMedia();
      emit('voice:leave');
    };
  }, [channelId, cleanupMedia, emit]);

  return {
    participants, connected, joined, muted, deafened, error,
    join, leave, toggleMute, toggleDeafen,
  };
}