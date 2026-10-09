import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CameraOff,
  Check,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { academicPaths } from "../data/academic-paths";
import { getCurrentUserEmail } from "../data/dashboardActivity";
import { getFirebaseIdToken } from "../data/firebaseAuth";
import { apiUrl } from "../data/api";
import UpgradeModal from "./UpgradeModal";

const questionCounts = [20];
const ASSESSMENT_RESULTS_KEY = "skillai-assessment-results";

export default function SkillAssessment() {
  const [stage, setStage] = useState("setup");
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [domain, setDomain] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [showUpgradeLink, setShowUpgradeLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraNotice, setCameraNotice] = useState("");
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  useEffect(() => {
    if (stage === "quiz" && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [stage, cameraReady]);

  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
  }, []);

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is unavailable. Use a supported browser over HTTPS and enable camera permissions.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("No camera was found. Connect a camera to start the assessment.");
      }

      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = stream;
      videoTrack.addEventListener("ended", () => {
        if (cameraStreamRef.current === stream) {
          setCameraReady(false);
          setCameraNotice("Camera stopped. Re-enable it to continue the assessment.");
        }
      }, { once: true });
      setCameraReady(true);
      setCameraNotice("");
    } catch (error) {
      setCameraReady(false);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        throw new Error("Camera permission was denied. Allow camera access in your browser settings to begin.");
      }
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        throw new Error("No camera was found. Connect a camera to start the assessment.");
      }
      throw error;
    }
  };

  const updateBranch = (event) => {
    const selectedBranch = event.target.value;
    const path = academicPaths[selectedBranch];
    setBranch(selectedBranch);
    setCourse(path?.courses[0] || "");
    setDomain(path?.domains[0] || "");
  };

  const updateCourse = (event) => {
    setCourse(event.target.value);
    setDomain(academicPaths[branch]?.domains[0] || "");
  };

  const startAssessment = async (event) => {
    event.preventDefault();
    setNotice("");
    setShowUpgradeLink(false);
    setIsGenerating(true);
    try {
      await startCamera();
      const token = await getFirebaseIdToken();
      const response = await fetch(apiUrl("/api/skill-assessment"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "assessment-generate", branch, course, domain, questionCount }),
      });
      const generated = await response.json();
      if (generated.code === "QUOTA_EXHAUSTED") {
        stopCamera();
        setShowUpgradeLink(true);
        return;
      }
      if (!response.ok) throw new Error(generated.error || "The agent couldn't create your assessment. Please try again.");
      if (
        !Array.isArray(generated.questions)
        || generated.questions.length !== questionCount
        || generated.questions.some((item) => (
          !item
          || typeof item.question !== "string"
          || !Array.isArray(item.options)
          || item.options.length !== 4
          || !Number.isInteger(item.correctOption)
          || item.correctOption < 0
          || item.correctOption > 3
          || typeof item.explanation !== "string"
        ))
      ) {
        throw new Error("The agent returned an incomplete assessment. Please try generating it again.");
      }

      setQuestions(generated.questions);
      setAnswers(Array(generated.questions.length).fill(null));
      setQuestionIndex(0);
      setResult(null);
      setStage("quiz");
    } catch (error) {
      stopCamera();
      setNotice(error.message || "The assessment could not be generated. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const requestAIFeedback = async (assessmentAnswers) => {
    setIsEvaluating(true);
    setNotice("");
    try {
      const response = await fetch(apiUrl("/api/skill-assessment"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getFirebaseIdToken()}` },
        body: JSON.stringify({
          action: "assessment-evaluate",
          branch,
          course,
          domain,
          answers: assessmentAnswers,
        }),
      });
      const evaluation = await response.json();
      if (!response.ok) throw new Error(evaluation.error || "The agent couldn't prepare your learning feedback.");
      if (
        !evaluation.result
        || !Number.isInteger(evaluation.result.score)
        || !Array.isArray(evaluation.result.strengths)
        || !Array.isArray(evaluation.result.improvements)
      ) {
        throw new Error("The agent returned an incomplete assessment report.");
      }
      setResult((current) => ({ ...current, aiFeedback: evaluation.result }));
    } catch (error) {
      setNotice(`${error.message || "Agent feedback is temporarily unavailable."} Your score is ready; you can retry the AI feedback below.`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const finishAssessment = async () => {
    const assessmentAnswers = questions.map((item, index) => ({
      ...item,
      selectedOption: answers[index],
    }));
    const correctCount = assessmentAnswers.filter((item) => item.selectedOption === item.correctOption).length;
    const score = Math.round((correctCount / assessmentAnswers.length) * 100);
    stopCamera();
    setResult({ score, correctCount, totalQuestions: assessmentAnswers.length, answers: assessmentAnswers, aiFeedback: null });
    setStage("result");
    try {
      const savedResults = JSON.parse(window.localStorage.getItem(ASSESSMENT_RESULTS_KEY) || "[]");
      if (!Array.isArray(savedResults)) throw new Error("Saved assessment history has an invalid format.");
      const activity = {
        id: `assessment-${window.crypto.randomUUID()}`,
        ownerEmail: getCurrentUserEmail(),
        branch,
        course,
        domain,
        score,
        totalQuestions: assessmentAnswers.length,
        completedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(ASSESSMENT_RESULTS_KEY, JSON.stringify([activity, ...savedResults].slice(0, 100)));
    } catch (error) {
      setNotice(`Your score is ready, but it could not be saved to your dashboard: ${error.message}`);
    }
    await requestAIFeedback(assessmentAnswers);
  };

  const chooseAnswer = (optionIndex) => {
    setAnswers((current) => current.map((answer, index) => index === questionIndex ? optionIndex : answer));
  };

  const restartAssessment = () => {
    stopCamera();
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setQuestionIndex(0);
    setNotice("");
    setStage("setup");
  };

  if (stage === "setup") {
    return (
      <main className="page-shell skill-assessment-page">
        <div className="wrap skill-assessment-shell">
          <Link to="/assessment" className="skill-assessment-back"><ArrowLeft size={16} /> Back to Skill Assessment</Link>
          <section className="skill-assessment-card">
            <span className="eyebrow">Personalized skill assessment</span>
            <h1>Choose what you want to assess.</h1>
            <p className="skill-assessment-intro">Select your study path and the agent will create a multiple-choice assessment for your field. Your webcam must stay on throughout the exam; your score and answer review appear when you finish.</p>
            <form className="skill-assessment-form" onSubmit={startAssessment}>
              <label className="interview-field">
                <span>Branch / stream</span>
                <select value={branch} onChange={updateBranch} required>
                  <option value="">Choose your branch</option>
                  {Object.keys(academicPaths).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="interview-field">
                <span>Course</span>
                <select value={course} onChange={updateCourse} disabled={!branch} required>
                  <option value="">Choose your course</option>
                  {(academicPaths[branch]?.courses || []).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="interview-field">
                <span>Assessment domain</span>
                <select value={domain} onChange={(event) => setDomain(event.target.value)} disabled={!course} required>
                  <option value="">Choose your domain</option>
                  {(academicPaths[branch]?.domains || []).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <p className="skill-assessment-hint">Course and domain choices update automatically when you change your branch.</p>
              <fieldset className="skill-assessment-count">
                <legend>Number of questions</legend>
                <div className="skill-assessment-count-options">
                  {questionCounts.map((count) => (
                    <button key={count} type="button" className={questionCount === count ? "selected" : ""} aria-pressed={questionCount === count} onClick={() => setQuestionCount(count)}>
                      <strong>{count}</strong><span>questions</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              {notice && <p className="interview-notice" role="alert">{notice}</p>}
              <button type="submit" className="primary-button skill-assessment-submit" disabled={isGenerating}>
                {isGenerating ? <><LoaderCircle className="interview-spinner" size={17} /> Agent is creating your questions...</> : <>Start assessment <ArrowRight size={17} /></>}
              </button>
              <p className="skill-assessment-privacy"><Sparkles size={15} /> Questions and personalized feedback are generated by the agent. Your webcam is used for the live exam preview and is not recorded. Your answers are only sent for the final feedback report.</p>
            </form>
          </section>
        </div>
        {showUpgradeLink && <UpgradeModal feature="skill assessments" onClose={() => setShowUpgradeLink(false)} />}
      </main>
    );
  }

  if (stage === "quiz") {
    const currentQuestion = questions[questionIndex];
    const progress = ((questionIndex + 1) / questions.length) * 100;
    const isLastQuestion = questionIndex === questions.length - 1;
    return (
      <main className="page-shell skill-assessment-page">
        <div className="wrap skill-assessment-shell">
          <div className="skill-assessment-session-top">
            <button type="button" className="skill-assessment-back-button" onClick={restartAssessment}><ArrowLeft size={16} /> Exit assessment</button>
            <span>{branch} <span aria-hidden="true">/</span> {domain}</span>
          </div>
          <section className="skill-assessment-quiz-card">
            <div className="skill-assessment-camera">
              <video ref={videoRef} autoPlay muted playsInline aria-label="Your live webcam preview" />
              <span className={`skill-assessment-camera-status${cameraReady ? " active" : ""}`} role="status">
                {cameraReady ? <><Camera size={14} /> Webcam on</> : <><CameraOff size={14} /> Webcam off</>}
              </span>
              {!cameraReady && (
                <div className="skill-assessment-camera-block">
                  <p>{cameraNotice || "Turn your webcam on to continue the assessment."}</p>
                  <button type="button" className="secondary-button" onClick={() => startCamera().catch((error) => setCameraNotice(error.message))}>
                    Enable webcam
                  </button>
                </div>
              )}
            </div>
            <div className="skill-assessment-progress-label"><span>Question {questionIndex + 1} of {questions.length}</span><span>{course}</span></div>
            <div className="skill-assessment-progress"><span style={{ width: `${progress}%` }} /></div>
            <span className="eyebrow">Choose the best answer</span>
            <h1>{currentQuestion.question}</h1>
            <div className="skill-assessment-options" role="radiogroup" aria-label={`Answers for question ${questionIndex + 1}`}>
              {currentQuestion.options.map((option, optionIndex) => (
                <button key={`${optionIndex}-${option}`} type="button" role="radio" aria-checked={answers[questionIndex] === optionIndex} className={`skill-assessment-option${answers[questionIndex] === optionIndex ? " selected" : ""}`} onClick={() => chooseAnswer(optionIndex)} disabled={!cameraReady}>
                  <span className="skill-assessment-option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>
                  {answers[questionIndex] === optionIndex && <Check size={17} />}
                </button>
              ))}
            </div>
            <div className="skill-assessment-question-controls">
              <button type="button" className="secondary-button" onClick={() => setQuestionIndex((current) => current - 1)} disabled={questionIndex === 0 || !cameraReady}>Previous</button>
              {isLastQuestion ? (
                <button type="button" className="primary-button" onClick={finishAssessment} disabled={answers[questionIndex] === null || isEvaluating || !cameraReady}>Finish assessment <Check size={16} /></button>
              ) : (
                <button type="button" className="primary-button" onClick={() => setQuestionIndex((current) => current + 1)} disabled={answers[questionIndex] === null || !cameraReady}>Next question <ArrowRight size={16} /></button>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell skill-assessment-page">
      <div className="wrap skill-assessment-shell">
        <section className="skill-assessment-result">
          <div className="skill-assessment-result-icon"><Check size={26} /></div>
          <span className="eyebrow">Assessment complete</span>
          <h1>Your {domain} result</h1>
          <p className="skill-assessment-result-path">{branch} · {course} · {result.totalQuestions} questions</p>
          <div className="skill-assessment-score-card">
            <div className="skill-assessment-score-ring" style={{ "--assessment-score": `${result.score}%` }}><span><strong>{result.score}</strong><small>out of 100</small></span></div>
            <div><span className="eyebrow">Your score</span><h2>{result.correctCount} of {result.totalQuestions} correct</h2><p>{result.score >= 80 ? "Strong work — keep building on this knowledge." : result.score >= 50 ? "Good progress — review the topics you missed to strengthen your skills." : "Use this as a starting point. Review the explanations and try again."}</p></div>
          </div>

          <section className="skill-assessment-feedback">
            <div className="skill-assessment-feedback-heading"><div><span className="eyebrow">Personalized feedback</span><h2>What to focus on next</h2></div>{isEvaluating && <span className="skill-assessment-feedback-loading"><LoaderCircle className="interview-spinner" size={17} /> Agent is preparing your report...</span>}</div>
            {result.aiFeedback ? (
              <>
                <p>{result.aiFeedback.summary}</p>
                <div className="skill-assessment-feedback-columns">
                  <div><h3>Strengths</h3><ul>{result.aiFeedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><h3>Next steps</h3><ul>{result.aiFeedback.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div>
                </div>
              </>
            ) : !isEvaluating ? (
              <div className="skill-assessment-retry">
                {notice && <p className="interview-notice" role="alert">{notice}</p>}
                <button type="button" className="secondary-button" onClick={() => requestAIFeedback(result.answers)}><RotateCcw size={15} /> Retry AI feedback</button>
              </div>
            ) : <p>Your score is ready. The agent is reviewing the questions you missed.</p>}
          </section>

          <section className="skill-assessment-review">
            <h2>Review your answers</h2>
            {result.answers.map((item, index) => {
              const wasCorrect = item.selectedOption === item.correctOption;
              return (
                <details key={`${index}-${item.question}`} className={`skill-assessment-review-item${wasCorrect ? " correct" : " incorrect"}`}>
                  <summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.question}</strong><small>{wasCorrect ? "Correct" : "Review"}</small></summary>
                  <div><p><strong>Your answer:</strong> {item.selectedOption === null ? "Not answered" : item.options[item.selectedOption]}</p><p><strong>Correct answer:</strong> {item.options[item.correctOption]}</p><p>{item.explanation}</p></div>
                </details>
              );
            })}
          </section>
          <div className="skill-assessment-result-actions">
            <Link to="/assessment" className="secondary-button">Back to Skill Assessment</Link>
            <button type="button" className="primary-button" onClick={restartAssessment}><RotateCcw size={16} /> Take another assessment</button>
          </div>
        </section>
      </div>
    </main>
  );
}
