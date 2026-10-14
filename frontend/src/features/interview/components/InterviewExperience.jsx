import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  FileText,
  LoaderCircle,
  Play,
  Sparkles,
  UploadCloud,
  Volume2,
} from "lucide-react";
import { Link } from "react-router-dom";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getInterviewerAvatar, interviewerAvatars } from "../data/interview-avatars";
import { academicPaths } from "../../../data/academic-paths";
import { getCurrentUserEmail } from "../../../data/dashboardActivity";
import { apiRequest } from "../../../services/api-client.js";
import UpgradeModal from "../../../components/shared/UpgradeModal.jsx";

const VirtualInterviewer = lazy(() => import("./VirtualInterviewer"));
const InterviewCallStage = lazy(() => import("./InterviewCallStage"));

const RECORDS_KEY = "skillai-interview-records";
const AUDIO_DATABASE = "skillai-interview-audio";

const durationOptions = [5, 10, 15, 20, 30];

function getVoiceGender(voice) {
  const declaredGender = voice.gender?.toLowerCase();
  if (declaredGender === "female" || declaredGender === "male") return declaredGender;

  const identity = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  if (/\b(female|woman|zira|heera|neerja|priya|raveena|aditi|samantha|susan|ava|aria)\b/.test(identity)) return "female";
  if (/\b(male|man|ravi|prabhat|david|mark|guy|daniel|james|hemant|madhur)\b/.test(identity)) return "male";
  return "";
}

function selectInterviewerVoice(voices, gender) {
  const rankedVoices = voices
    .map((voice) => {
      const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
      const language = voice.lang.toLowerCase();
      const languageScore = language === "en-in" ? 4 : language.startsWith("en-in") ? 3 : language.startsWith("en") ? 2 : 0;
      const qualityScore = /\b(neural|natural|online|premium)\b/.test(name) ? 3 : 0;
      const genderScore = getVoiceGender(voice) === gender ? 2 : getVoiceGender(voice) ? 0 : 1;
      return { voice, score: languageScore + qualityScore + genderScore };
    })
    .filter(({ voice }) => voice.lang.toLowerCase().startsWith("en"))
    .sort((first, second) => second.score - first.score);

  return rankedVoices[0]?.voice || null;
}

function findResumeName(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 12);
  const labeledName = lines.find((line) => /^(?:name|candidate)\s*[:\-]/i.test(line));
  const candidate = labeledName?.replace(/^(?:name|candidate)\s*[:\-]\s*/i, "");
  if (candidate && candidate.split(/\s+/).length >= 2) return candidate;

  const likelyName = lines.find((line) => (
    line.length >= 4
    && line.length <= 60
    && /^[A-Za-z][A-Za-z.' -]+$/.test(line)
    && line.split(/\s+/).length >= 2
    && !/resume|curriculum vitae|profile|summary|experience|education|skills/i.test(line)
  ));
  return likelyName || "";
}

async function extractResumeText(file) {
  const data = await file.arrayBuffer();
  let text = "";

  if (file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const loadingTask = pdfjsLib.getDocument({ data });
    try {
      const pdf = await loadingTask.promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const lines = new Map();
        content.items.forEach((item) => {
          if (!("str" in item) || !item.str.trim()) return;
          const y = Math.round(item.transform?.[5] || 0);
          lines.set(y, [...(lines.get(y) || []), item.str]);
        });
        pages.push(Array.from(lines.entries())
          .sort(([firstY], [secondY]) => secondY - firstY)
          .map(([, parts]) => parts.join(" "))
          .join("\n"));
      }
      text = pages.join("\n");
    } finally {
      await loadingTask.destroy();
    }
  } else if (file.name.toLowerCase().endsWith(".docx")) {
    const mammothModule = await import("mammoth/mammoth.browser");
    const mammoth = mammothModule.default || mammothModule;
    const result = await mammoth.extractRawText({ arrayBuffer: data });
    text = result.value;
  } else {
    text = await file.text();
  }

  if (!text.trim()) throw new Error("We couldn't find readable text in that resume. Try a text-based PDF, DOCX, or TXT file.");
  return text.slice(0, 100000);
}

function openAudioDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(AUDIO_DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("recordings", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local audio storage."));
  });
}

async function saveAudioRecording(id, blob) {
  const database = await openAudioDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("recordings", "readwrite");
    transaction.objectStore("recordings").put({ id, blob });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Could not save the audio recording."));
    transaction.onabort = () => reject(transaction.error || new Error("Audio saving was interrupted."));
  });
  database.close();
}

async function loadAudioRecording(id) {
  const database = await openAudioDatabase();
  const blob = await new Promise((resolve, reject) => {
    const request = database.transaction("recordings", "readonly").objectStore("recordings").get(id);
    request.onsuccess = () => resolve(request.result?.blob || null);
    request.onerror = () => reject(request.error || new Error("Could not load this recording."));
  });
  database.close();
  return blob;
}

function readSavedRecords() {
  const serialized = window.localStorage.getItem(RECORDS_KEY);
  return serialized ? JSON.parse(serialized) : [];
}

export default function InterviewExperiencePage() {
  const [stage, setStage] = useState("setup");
  const [branch, setBranch] = useState("");
  const [domain, setDomain] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeConsent, setResumeConsent] = useState(false);
  const [resumeStatus, setResumeStatus] = useState("");
  const [duration, setDuration] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechMouthLevel, setSpeechMouthLevel] = useState(0);
  const [notice, setNotice] = useState("");
  const [showUpgradeLink, setShowUpgradeLink] = useState(false);
  const [savedRecords, setSavedRecords] = useState([]);
  const [audioUrl, setAudioUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptRef = useRef("");
  const sessionIdRef = useRef("");
  const evaluationStartedRef = useRef(false);
  const finishOnTimeoutRef = useRef(null);
  const recordingStopResolverRef = useRef(null);

  useEffect(() => {
    try {
      setSavedRecords(readSavedRecords());
    } catch (error) {
      setNotice(`Saved interview records could not be loaded: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    if (stage !== "session") return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current > 0 ? current - 1 : 0);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "session" || secondsLeft !== 0) return;
    finishOnTimeoutRef.current?.();
  }, [secondsLeft, stage]);

  useEffect(() => {
    if (stage !== "session") return undefined;
    const greeting = `Hello ${candidateName.split(/\s+/)[0] || "there"}. Welcome to your ${domain} interview. Take a breath and answer in your own words.`;
    const question = questions[questionIndex];
    if (!("speechSynthesis" in window) || !question) return undefined;

    window.speechSynthesis.cancel();
    const speechText = questionIndex === 0 ? `${greeting} ${question}` : question;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = "en-IN";
    const interviewerGender = getInterviewerAvatar(interviewerId)?.gender || "female";
    const voice = selectInterviewerVoice(window.speechSynthesis.getVoices(), interviewerGender);
    if (voice) utterance.voice = voice;
    utterance.pitch = 1;
    utterance.rate = 0.9;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeechMouthLevel(-1);
    };
    utterance.onboundary = (event) => {
      const spokenWord = speechText.slice(event.charIndex, event.charIndex + (event.charLength || 1)).toLowerCase();
      if (!spokenWord.trim()) return;
      const vowelOpenness = { a: 0.88, e: 0.58, i: 0.3, o: 0.76, u: 0.4 };
      const vowelLevels = [...spokenWord]
        .map((letter) => vowelOpenness[letter])
        .filter((level) => level !== undefined);
      setSpeechMouthLevel(vowelLevels.length
        ? Math.max(0.08, vowelLevels.reduce((sum, level) => sum + level, 0) / vowelLevels.length)
        : 0.08);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechMouthLevel(0);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechMouthLevel(0);
    };
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [candidateName, domain, interviewerId, questionIndex, questions, stage]);

  useEffect(() => {
    if (!audioUrl) return undefined;
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (stage !== "complete") return;
    if (recorderRef.current?.state === "recording") stopRecording();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, [stage]);

  const handleResume = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
      setResumeStatus("Please upload a PDF, DOCX, or TXT resume.");
      setResumeFile(null);
      setResumeText("");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeStatus("Please choose a resume smaller than 10 MB.");
      setResumeFile(null);
      setResumeText("");
      return;
    }

    setResumeStatus("Reading your resume securely in this browser...");
    setResumeFile(null);
    setResumeText("");
    setResumeConsent(false);
    try {
      const text = await extractResumeText(file);
      setResumeFile(file);
      setResumeText(text);
      const detectedName = findResumeName(text);
      if (detectedName) setCandidateName(detectedName);
      setResumeStatus(detectedName
        ? `Resume ready. We found “${detectedName}” — you can edit the name below.`
        : "Resume ready. We couldn't confidently detect a name, so please enter it below.");
    } catch (error) {
      setResumeStatus(error.message || "We couldn't read that resume. Please try another file.");
    }
  };

  const handleBranchChange = (event) => {
    const selectedBranch = event.target.value;
    setBranch(selectedBranch);
    setDomain(academicPaths[selectedBranch]?.domains[0] || "");
  };

  const beginInterview = async (event) => {
    event.preventDefault();
    if (!resumeText || !resumeFile) {
      setNotice("Please upload a readable resume before starting your interview.");
      return;
    }
    if (!branch || !domain || !candidateName.trim() || !interviewerId) {
      setNotice("Please complete your name, branch, domain, and AI interviewer selection before starting.");
      return;
    }
    if (!resumeConsent) {
      setNotice("Please allow the resume text to be sent to the agent to generate your questions.");
      return;
    }

    setIsGenerating(true);
    setNotice("");
    setShowUpgradeLink(false);
    try {
      const response = await apiRequest("/api/generate-interview", {
        method: "POST",
        body: JSON.stringify({
          branch,
          domain,
          durationMinutes: duration,
          resumeText: resumeText.slice(0, 12000),
        }),
      });
      const result = await response.json();
      if (result.code === "QUOTA_EXHAUSTED") {
        setShowUpgradeLink(true);
        return;
      }
      if (!response.ok) throw new Error(result.error || "Question generation failed. Please try again.");
      if (!Array.isArray(result.questions) || result.questions.length !== 5) {
        throw new Error("The AI service returned an unexpected question set. Please try again.");
      }

      setQuestions(result.questions);
      sessionIdRef.current = `interview-${Date.now()}`;
      setQuestionIndex(0);
      setAnswer("");
      setEvaluationResult(null);
      evaluationStartedRef.current = false;
      transcriptRef.current = "";
      setSecondsLeft(duration * 60);
      setStage("session");
    } catch (error) {
      setNotice(error.message || "Question generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const persistAnswer = async (audioBlob = null, question = questions[questionIndex], index = questionIndex) => {
    const transcript = transcriptRef.current.trim();
    const answerId = `${sessionIdRef.current}-${index}`;
    const record = {
      id: answerId,
      sessionId: sessionIdRef.current,
      ownerEmail: getCurrentUserEmail(),
      candidateName: candidateName.trim(),
      branch,
      domain,
      question,
      answer: transcript,
      answeredAt: new Date().toISOString(),
      durationMinutes: duration,
      audioSaved: false,
    };

    let records;
    try {
      records = readSavedRecords();
      const existingIndex = records.findIndex((item) => item.id === answerId);
      if (existingIndex >= 0) records[existingIndex] = { ...records[existingIndex], ...record };
      else records.unshift(record);
      window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(0, 100)));
    } catch (error) {
      throw new Error(`Your answer couldn't be saved in this browser: ${error.message}`);
    }

    let audioSaved = false;
    if (audioBlob?.size) {
      try {
        await saveAudioRecording(answerId, audioBlob);
        records = records.map((item) => item.id === answerId ? { ...item, audioSaved: true } : item);
        window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(0, 100)));
        audioSaved = true;
      } catch (error) {
        setNotice(`Your answer text was saved, but its audio recording could not be stored: ${error.message}`);
      }
    }

    setSavedRecords(records.slice(0, 100));
    return { audioSaved };
  };

  const evaluateInterview = async () => {
    if (evaluationStartedRef.current) return;
    evaluationStartedRef.current = true;
    setStage("evaluating");
    setIsEvaluating(true);
    setNotice("");

    try {
      const records = readSavedRecords()
        .filter((record) => record.sessionId === sessionIdRef.current)
        .sort((first, second) => Number(first.id.split("-").at(-1)) - Number(second.id.split("-").at(-1)));
      if (!records.length) throw new Error("There are no saved answers to evaluate yet.");
      const response = await apiRequest("/api/generate-interview", {
        method: "POST",
        body: JSON.stringify({
          action: "evaluate",
          branch,
          domain,
          durationMinutes: duration,
          answers: records.map(({ question, answer: savedAnswer }) => ({ question, answer: savedAnswer })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The interview result could not be generated.");
      if (
        !result.result
        || !Number.isInteger(result.result.score)
        || !Array.isArray(result.result.strengths)
        || !Array.isArray(result.result.improvements)
        || !Array.isArray(result.result.answerFeedback)
      ) {
        throw new Error("The AI service returned an incomplete interview result.");
      }

      const savedResult = {
        ...result.result,
        sessionId: sessionIdRef.current,
        ownerEmail: getCurrentUserEmail(),
        branch,
        domain,
        evaluatedAt: new Date().toISOString(),
      };
      try {
        const storedResults = JSON.parse(window.localStorage.getItem("skillai-interview-results") || "[]");
        window.localStorage.setItem(
          "skillai-interview-results",
          JSON.stringify([savedResult, ...storedResults.filter((item) => item.sessionId !== sessionIdRef.current)].slice(0, 100)),
        );
      } catch (error) {
        setNotice(`Your result was generated but could not be saved on this device: ${error.message}`);
      }
      setEvaluationResult(savedResult);
      setStage("complete");
      evaluationStartedRef.current = false;
    } catch (error) {
      setNotice(error.message || "The interview result could not be generated. Please try again.");
      setStage("complete");
      evaluationStartedRef.current = false;
    } finally {
      setIsEvaluating(false);
    }
  };

  const finishInterview = async () => {
    if (evaluationStartedRef.current) return;
    try {
      if (recorderRef.current?.state === "recording") {
        await stopRecording();
      } else {
        const currentAnswerId = `${sessionIdRef.current}-${questionIndex}`;
        const records = readSavedRecords();
        if (!records.some((record) => record.id === currentAnswerId)) await persistAnswer();
      }
      await evaluateInterview();
    } catch (error) {
      setNotice(error.message || "The final answer could not be saved.");
      setStage("complete");
    }
  };

  finishOnTimeoutRef.current = finishInterview;

  const startRecording = async () => {
    setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setNotice("Audio recording isn't supported in this browser. You can type your answer and save it instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setIsSaving(true);
        try {
          const result = await persistAnswer(audioBlob);
          setNotice(result.audioSaved
            ? "Answer and audio recording saved on this device."
            : "Your answer was saved. This browser couldn't keep the audio recording.");
        } catch (error) {
          setNotice(error.message);
        } finally {
          setIsSaving(false);
          recordingStopResolverRef.current?.();
          recordingStopResolverRef.current = null;
        }
      };
      recorder.start();
      setIsRecording(true);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-IN";
        recognition.onresult = (event) => {
          const spoken = Array.from(event.results)
            .filter((result) => result.isFinal)
            .map((result) => result[0].transcript.trim())
            .filter(Boolean)
            .join(" ");
          if (spoken) {
            transcriptRef.current = spoken;
            setAnswer(spoken);
          }
        };
        recognition.onerror = () => {
          setNotice("Audio is recording. Speech-to-text isn't available right now; type your answer below if you want a transcript.");
        };
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
          setNotice("Audio is recording. You can type your answer below while you speak.");
        }
      } else {
        setNotice("Audio is recording. Type your answer below to save a text transcript too.");
      }
    } catch (error) {
      setNotice(`Microphone access is needed to record an answer: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state !== "recording") return Promise.resolve();
    setIsSaving(true);
    const stopped = new Promise((resolve) => {
      recordingStopResolverRef.current = resolve;
    });
    recorderRef.current.stop();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    return stopped;
  };

  const updateAnswer = (value) => {
    transcriptRef.current = value;
    setAnswer(value);
  };

  const saveAndContinue = async () => {
    if (isRecording || isSaving) return;
    setNotice("");
    setIsSaving(true);
    try {
      await persistAnswer();
      if (questionIndex === questions.length - 1) {
        await evaluateInterview();
      } else {
        setQuestionIndex((current) => current + 1);
        setAnswer("");
        transcriptRef.current = "";
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const playRecording = async (id) => {
    try {
      const blob = await loadAudioRecording(id);
      if (!blob) {
        setNotice("This audio recording is no longer available on this device.");
        return;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
      setNotice("");
    } catch (error) {
      setNotice(`The saved recording couldn't be opened: ${error.message}`);
    }
  };

  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const currentRecords = savedRecords
    .filter((record) => record.sessionId === sessionIdRef.current)
    .sort((first, second) => Number(first.id.split("-").at(-1)) - Number(second.id.split("-").at(-1)));

  if (stage === "setup") {
    return (
      <main className="page-shell interview-experience">
        <div className="wrap interview-experience-wrap">
          <Link to="/interview" className="interview-back"><ArrowLeft size={16} /> Back to AI Interview</Link>
          <div className="interview-setup-layout">
            <section className="interview-form-card">
              <span className="eyebrow">Your interview, your field</span>
              <h1>Let's set up your interview.</h1>
              <p className="interview-setup-intro">Add your resume and choose your direction. With your consent, extracted resume text is sent securely to the agent to generate tailored questions; the original file stays on this device.</p>

              <form className="interview-setup-form" onSubmit={beginInterview}>
                <label className="interview-upload">
                  <input className="interview-file-input" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleResume} aria-label="Choose a PDF, DOCX, or TXT resume" required={!resumeFile} />
                  <span className="upload-icon"><UploadCloud size={22} /></span>
                  <strong>{resumeFile ? resumeFile.name : "Upload your resume"}</strong>
                  <small>PDF, DOCX, or TXT · up to 10 MB</small>
                  <span className="resume-pick-button">
                    {resumeFile ? "Choose another file" : "Choose file"}
                  </span>
                  {resumeStatus && <span className={`resume-status${resumeFile ? " ready" : ""}`}>{resumeStatus}</span>}
                </label>

                <label className="interview-field">
                  <span>Your name <small>We’ll use this to greet you</small></span>
                  <input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} placeholder="Name detected from your resume" autoComplete="name" required />
                </label>

                <div className="interview-fields-row">
                  <label className="interview-field">
                    <span>Branch / stream</span>
                    <select value={branch} onChange={handleBranchChange} required>
                      <option value="">Choose your branch</option>
                      {Object.keys(academicPaths).map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="interview-field">
                    <span>Interview domain</span>
                    <select value={domain} onChange={(event) => setDomain(event.target.value)} disabled={!branch} required>
                      <option value="">Choose a domain</option>
                      {(academicPaths[branch]?.domains || []).map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    {branch && <small className="field-hint">Options update automatically for {branch}.</small>}
                  </label>
                </div>

                <fieldset className="interview-gender-field">
                  <legend>AI interviewer <small>Choose from 3 male and 2 female interviewers</small></legend>
                  <div className="interview-gender-options">
                    {interviewerAvatars.map((avatar) => (
                      <button key={avatar.id} type="button" role="radio" aria-checked={interviewerId === avatar.id} className={`interview-gender-option${interviewerId === avatar.id ? " selected" : ""}`} onClick={() => setInterviewerId(avatar.id)}>
                        <span className="gender-avatar-icon" aria-hidden="true">{avatar.name.split(" ").map((part) => part[0]).join("")}</span>
                        <span className="interview-avatar-copy"><strong>{avatar.name}</strong><small>{avatar.gender === "male" ? "Male" : "Female"} · {avatar.title}</small></span>
                        {interviewerId === avatar.id && <Check className="gender-selected-icon" size={15} />}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="interview-field duration-field">
                  <span>Interview length</span>
                  <div className="duration-options">
                    {durationOptions.map((minutes) => (
                      <button key={minutes} type="button" className={duration === minutes ? "selected" : ""} onClick={() => setDuration(minutes)}>
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </label>

                <label className="interview-consent">
                  <input type="checkbox" checked={resumeConsent} onChange={(event) => setResumeConsent(event.target.checked)} required />
                  <span>I agree to send my extracted resume text and interview details to the agent for questions, and my answers for feedback after the practice.</span>
                </label>
                {notice && <p className="interview-notice" role="alert">{notice}</p>}
                <button type="submit" className="primary-button interview-submit" disabled={isGenerating}>
                  {isGenerating ? <><LoaderCircle className="interview-spinner" size={17} /> Generating your questions...</> : <>Start my interview <ArrowRight size={17} /></>}
                </button>
                <p className="interview-privacy"><FileText size={14} /> The app server does not retain the resume text. Answers are saved locally in this browser.</p>
              </form>
            </section>

            <aside className="interview-setup-aside">
              {interviewerId ? (
                <Suspense fallback={<div className="virtual-interviewer virtual-interviewer-loading" aria-label="Loading AI interviewer" />}>
                  <VirtualInterviewer speaking={false} avatarId={interviewerId} />
                </Suspense>
              ) : (
                <div className="avatar-selection-preview" role="status">
                  <span className="interviewer-online"><span /> 5 interviewers ready</span>
                  <p>Select an interviewer to load its 3D preview.</p>
                </div>
              )}
              <div className="setup-aside-note">
                <Sparkles size={18} />
                <div><strong>A practice conversation made for you</strong><p>The agent builds your questions from the selected branch, domain, duration, and resume details.</p>                </div>
              </div>
              {savedRecords.length > 0 && <p className="saved-count"><Check size={15} /> {savedRecords.length} answer{savedRecords.length === 1 ? "" : "s"} saved on this device</p>}
            </aside>
          </div>
        </div>
        {showUpgradeLink && <UpgradeModal feature="AI interview practice" onClose={() => setShowUpgradeLink(false)} />}
      </main>
    );
  }

  if (stage === "evaluating") {
    return (
      <main className="page-shell interview-experience">
        <section className="wrap interview-evaluating" aria-live="polite">
          <span className="result-loader"><LoaderCircle className="interview-spinner" size={34} /></span>
          <span className="eyebrow">Your practice is complete</span>
          <h1>Preparing your interview result...</h1>
          <p>The agent is reviewing your answers for clear examples, relevant knowledge, and thoughtful reasoning.</p>
        </section>
      </main>
    );
  }

  if (stage === "complete") {
    return (
      <main className="page-shell interview-experience">
        <div className="wrap interview-complete">
          <div className="complete-icon"><Check size={30} /></div>
          <span className="eyebrow">Interview complete</span>
          <h1>Well done, {candidateName.split(/\s+/)[0]}.</h1>
          <p>Your practice answers have been saved in this browser. Review your personalized feedback and revisit any audio answer below.</p>
          {evaluationResult ? (
            <section className="interview-result-report">
              <div className="result-score-card">
                <div className="result-score-ring" style={{ "--result-score": `${evaluationResult.score}%` }}>
                  <span><strong>{evaluationResult.score}</strong><small>/ 100</small></span>
                </div>
                <div className="result-score-copy">
                  <span className="eyebrow">Your practice score</span>
                  <h2>Interview readiness</h2>
                  <p>{evaluationResult.summary}</p>
                </div>
              </div>
              <div className="result-feedback-grid">
                <article className="result-feedback-card">
                  <h2>What went well</h2>
                  <ul>{evaluationResult.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul>
                </article>
                <article className="result-feedback-card">
                  <h2>Focus for next time</h2>
                  <ul>{evaluationResult.improvements.map((improvement) => <li key={improvement}>{improvement}</li>)}</ul>
                </article>
              </div>
            </section>
          ) : (
            <section className="result-unavailable">
              <strong>Your answers are saved, but the AI result is not ready yet.</strong>
              <p>{notice || "Check your connection and ask the agent to review your answers."}</p>
              <button type="button" className="secondary-button" onClick={evaluateInterview} disabled={isEvaluating}>
                {isEvaluating ? "Generating result..." : "Try generating my result again"}
              </button>
            </section>
          )}
          {notice && <p className="interview-notice" role="status">{notice}</p>}
          <section className="saved-answer-list">
            <div className="saved-answer-heading"><h2>Your saved answers</h2><span>{currentRecords.length} saved</span></div>
            {currentRecords.length ? currentRecords.map((record, index) => (
              <article className="saved-answer-card" key={record.id}>
                <div className="saved-answer-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="saved-answer-body">
                  <h3>{record.question}</h3>
                  <p>{record.answer || "Audio answer saved. No transcript was detected for this response."}</p>
                  {evaluationResult?.answerFeedback[index] && (
                    <div className="answer-result-feedback">
                      <strong>AI feedback · {evaluationResult.answerFeedback[index].score}/100</strong>
                      <span>{evaluationResult.answerFeedback[index].feedback}</span>
                    </div>
                  )}
                  {record.audioSaved && <button type="button" className="text-link saved-play" onClick={() => playRecording(record.id)}><Play size={14} /> Play audio</button>}
                </div>
              </article>
            )) : <p className="empty-answers">No answers were saved in this session.</p>}
            {audioUrl && <audio className="saved-audio-player" controls src={audioUrl}>Your browser does not support audio playback.</audio>}
          </section>
          <div className="complete-actions">
            <Link to="/interview" className="primary-button">Back to AI Interview <ArrowRight size={16} /></Link>
            <button type="button" className="secondary-button" onClick={() => { setStage("setup"); setNotice(""); }}>Start another practice</button>
          </div>
        </div>
      </main>
    );
  }

  const progress = questions.length ? ((questionIndex + 1) / questions.length) * 100 : 0;
  return (
    <main className="page-shell interview-experience">
      <div className="wrap interview-session-wrap">
        <div className="session-topline">
          <Link to="/interview" className="interview-back"><ArrowLeft size={16} /> Exit interview</Link>
          <span className="session-field">{branch} <span>/</span> {domain}</span>
          <div className={`session-timer${secondsLeft < 60 ? " urgent" : ""}`}><Clock3 size={16} /> {formatTime(secondsLeft)} left</div>
        </div>

        <div className="session-progress" aria-label={`Question ${questionIndex + 1} of ${questions.length}`}>
          <div><span>Question {questionIndex + 1} of {questions.length}</span><span>{duration}-minute session</span></div>
          <div className="session-progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="interview-live-layout">
          <section className="interview-live-main">
            <Suspense fallback={<div className="interview-call-loading" aria-label="Loading video call" />}>
              <InterviewCallStage
                speaking={isSpeaking}
                speechMouthLevel={speechMouthLevel}
                avatarId={interviewerId}
                candidateName={candidateName}
                recording={isRecording}
                saving={isSaving}
                onToggleRecording={isRecording ? stopRecording : startRecording}
              />
            </Suspense>
            <div className="live-question-card">
              <span className="eyebrow">Your interviewer asks</span>
              <h1>{questions[questionIndex]}</h1>
              <div className="live-question-meta"><Volume2 size={15} /> The question is read aloud. Answer in your own words.</div>
            </div>
            <label className="answer-input">
              <span>Your answer <small>{isRecording ? "Recording is on — your transcript appears here when supported" : "Speak or type your response"}</small></span>
              <textarea value={answer} onChange={(event) => updateAnswer(event.target.value)} placeholder="Your speech transcript or typed answer will appear here..." rows={5} />
            </label>
            {notice && <p className="interview-notice" role="status">{notice}</p>}
            <div className="answer-controls">
              <button type="button" className="primary-button answer-next" onClick={saveAndContinue} disabled={isRecording || isSaving}>
                {isSaving ? "Saving..." : questionIndex === questions.length - 1 ? "Finish interview" : "Save & next"} <ArrowRight size={16} />
              </button>
            </div>
          </section>

          <aside className="interview-session-side">
            <div className="session-profile"><span className="profile-initial">{candidateName.trim().charAt(0).toUpperCase()}</span><div><strong>{candidateName}</strong><small>{domain} practice</small></div></div>
            <div className="session-side-card">
              <h2>Interview tips</h2>
              <ul><li>Take a moment to think before you answer.</li><li>Use a real example from your work or studies.</li><li>Explain what you did and what you learned.</li></ul>
            </div>
            <div className="session-save-state"><Check size={16} /><span>{currentRecords.length} answer{currentRecords.length === 1 ? "" : "s"} saved locally</span></div>
            <p className="session-local-note">Your practice stays in this browser on this device.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
