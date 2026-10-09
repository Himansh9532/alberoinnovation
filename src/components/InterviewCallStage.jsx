import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";
import VirtualInterviewer from "./VirtualInterviewer";

export default function InterviewCallStage({
  avatarId,
  candidateName,
  speaking,
  speechMouthLevel,
  recording,
  saving,
  onToggleRecording,
}) {
  const videoRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraNotice, setCameraNotice] = useState("");

  useEffect(() => {
    if (!cameraEnabled) {
      setCameraReady(false);
      return undefined;
    }

    let active = true;
    let stream;
    setCameraNotice("");
    setCameraReady(false);

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (!active) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    };

    startCamera().catch((error) => {
      if (!active) return;
      setCameraNotice(error.message || "Camera access could not be started.");
      setCameraEnabled(false);
    });

    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [cameraEnabled]);

  const toggleCamera = () => {
    setCameraNotice("");
    setCameraEnabled((enabled) => !enabled);
  };

  return (
    <section className="interview-call-room" aria-label="Interview video call">
      <div className="interview-call-participants">
        <div className={`call-participant candidate-participant${cameraEnabled ? " camera-on" : ""}`}>
          {cameraEnabled ? (
            <>
              <video ref={videoRef} className="candidate-camera-feed" autoPlay muted playsInline aria-label="Your live camera preview" />
              {!cameraReady && <span className="candidate-camera-status">Starting camera…</span>}
            </>
          ) : (
            <div className="candidate-camera-off">
              <span className="candidate-camera-avatar">{candidateName.trim().charAt(0).toUpperCase()}</span>
              <span>Camera is off</span>
            </div>
          )}
          <div className="call-participant-name">
            <span>{candidateName} (You)</span>
            {cameraEnabled ? <Camera size={14} /> : <CameraOff size={14} />}
          </div>
        </div>

        <div className="call-participant interviewer-participant">
          <VirtualInterviewer speaking={speaking} speechMouthLevel={speechMouthLevel} avatarId={avatarId} />
        </div>
      </div>

      <div className="interview-call-toolbar" aria-label="Call controls">
        <span className="call-toolbar-status"><span /> Interview in progress</span>
        <div className="call-toolbar-actions">
          <button
            type="button"
            className={`call-control-button${recording ? " active" : ""}`}
            onClick={onToggleRecording}
            disabled={saving}
            aria-label={recording ? "Stop recording answer" : "Start recording answer"}
            title={recording ? "Stop recording answer" : "Record answer"}
          >
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{recording ? "Stop" : "Record"}</span>
          </button>
          <button
            type="button"
            className={`call-control-button${cameraEnabled ? " active" : ""}`}
            onClick={toggleCamera}
            aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
            title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
          >
            {cameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
            <span>{cameraEnabled ? "Camera on" : "Camera"}</span>
          </button>
        </div>
      </div>

      {cameraNotice && <p className="camera-permission-notice" role="status">{cameraNotice}</p>}
    </section>
  );
}
