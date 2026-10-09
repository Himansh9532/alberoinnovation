import { CameraOff, MoreHorizontal, Volume2 } from "lucide-react";
import HumanoidAvatar3D from "./HumanoidAvatar3D";
import { getInterviewerAvatar } from "../data/interview-avatars";

export default function VirtualInterviewer({ speaking, speechMouthLevel, avatarId }) {
  const interviewer = getInterviewerAvatar(avatarId);
  const interviewerName = interviewer?.name || "Choose your interviewer";
  const interviewerRole = interviewer?.title || "AI interviewer";

  return (
    <div className={`virtual-interviewer${speaking ? " speaking" : ""}`} role="group" aria-label={`${interviewerName}, AI interviewer`}>
      <div className="video-scene">
        <div className="video-scene-backdrop" />
        {interviewer ? (
          <HumanoidAvatar3D speaking={speaking} speechMouthLevel={speechMouthLevel} avatarId={interviewer.id} />
        ) : (
          <div className="avatar-select-prompt">Choose an interviewer to preview their 3D avatar</div>
        )}
        <div className="video-scene-shade" />
        <div className="video-call-topline">
          <span className="interviewer-online"><span /> AI interviewer</span>
          <span className="video-call-mode">Live practice</span>
        </div>
        <div className="self-preview" aria-label="Your camera preview is off">
          <span className="self-preview-avatar">YOU</span>
          <span className="self-preview-label"><CameraOff size={12} /> Camera off</span>
        </div>
        <div className="interviewer-nameplate">
          <span className="interviewer-name">{interviewerName}</span>
          <span className="interviewer-role">SkillAI · {interviewerRole}</span>
        </div>
        <span className="interviewer-voice"><Volume2 size={15} /> {speaking ? "Speaking" : "Listening"}</span>
        <span className="video-call-menu" aria-hidden="true"><MoreHorizontal size={19} /></span>
      </div>
    </div>
  );
}
