"use client";
import { EditPhotoButton, PhotoCredit, SiteImage } from "../MediaEditing";
import { Component, lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { academy, images } from "../../content/academy";
import { fieldLabels, initialIntro, introReducer, phaseLabel, runTimeline, shots } from "../../lib/cricket";
import { CREASE_SECONDS, creaseDeliveries } from "../../lib/crease-match";
import "./crease.css";
import { CricketAudio } from "../../lib/audio";
import FieldFallback from "./FieldFallback";
import { sitePath } from "../../lib/site";

const FieldScene = lazy(() => import("./FieldScene"));
class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function hasWebGL() {
  const canvas = document.createElement("canvas");
  try {
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch { return false; }
}
export default function CricketIntro({ autoPlay = true }: { autoPlay?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [state, dispatch] = useReducer(introReducer, initialIntro);
  const [progress, setProgress] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [audioError, setAudioError] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [overview, setOverview] = useState(false);
  const [previewPaused, setPreviewPaused] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const audio = useRef<CricketAudio | null>(null);
  const finish = useCallback(() => {
    dispatch({ type: "FINISH" });
    setVisible(false);
    try { sessionStorage.setItem("tailor-intro", "seen"); } catch { console.info("[intro] Session storage unavailable; replay preference not persisted."); }
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, []);
  const failure = useCallback(() => { setSceneFailed(true); setEnhanced(false); }, []);
  const sceneReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    const initialize = () => {
      const params = new URLSearchParams(location.search);
      let seen = false;
      try { seen = sessionStorage.getItem("tailor-intro") === "seen"; } catch { setStorageNotice("Session preference storage is unavailable; the site still works."); }
      if (location.hash || ((!autoPlay || seen) && params.get("intro") !== "1")) return;
      const supported = hasWebGL();
      setWebgl(supported);
      setEnhanced(supported && !matchMedia("(prefers-reduced-motion: reduce)").matches);
      setVisible(true);
    };
    const id = requestAnimationFrame(initialize);
    const replay = () => {
      history.replaceState(null, "", sitePath("/?intro=1"));
      dispatch({ type: "REPLAY" });
      setProgress(0); setReady(false); setSceneFailed(false); setMuted(true); setSelectedZone("");
      setOverview(false); setPreviewPaused(false);
      initialize();
    };
    window.addEventListener("academy-replay", replay);
    return () => { cancelAnimationFrame(id); window.removeEventListener("academy-replay", replay); };
  }, [autoPlay]);
  useEffect(() => {
    if (!visible) return;
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [visible]);
  useEffect(() => { if (visible && state.stage !== "playing") title.current?.focus(); }, [visible, state.stage]);
  useEffect(() => {
    if (!visible) return;
    const hide = () => { if (document.hidden) finish(); };
    const hash = () => finish();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("hashchange", hash);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener("hashchange", hash); };
  }, [visible, finish]);
  const use3d = enhanced && !reduced && !sceneFailed;
  useEffect(() => {
    if (state.stage === "role" || !use3d || ready) return;
    const timeout = setTimeout(failure, 15000);
    return () => clearTimeout(timeout);
  }, [state.stage, use3d, ready, failure]);
  useEffect(() => {
    if (!visible || state.stage !== "playing" || !state.technique || (use3d && !ready)) return;
    if (reduced) return;
    let sounded = false;
    return runTimeline(use3d ? CREASE_SECONDS * 1000 : state.technique.duration + 2200, p => {
      setProgress(p);
      if (p >= (use3d ? 0.57 : 0.28) && !sounded) { sounded = true; audio.current?.contact(); }
    }, finish);
  }, [state.stage, state.technique, visible, use3d, ready, reduced, finish]);
  useEffect(() => {
    if (!visible) {
      void audio.current?.dispose().catch(() => console.warn("[intro] Audio cleanup failed."));
      audio.current = null;
    }
    return () => { void audio.current?.dispose().catch(() => console.warn("[intro] Audio cleanup failed.")); };
  }, [visible]);
  async function toggleSound() {
    if (!muted) {
      await audio.current?.dispose();
      audio.current = null;
      setMuted(true);
      return;
    }
    try { audio.current = new CricketAudio(); await audio.current.enable(); setMuted(false); setAudioError(""); }
    catch { setAudioError("Sound unavailable. The experience continues silently."); setMuted(true); }
  }
  if (!visible) return null;
  const selection = state.role === "batsman" ? shots : creaseDeliveries;
  const ballTransition = state.stage === "playing" && progress > 0.94 && !reduced;
  const renderProgress = reduced && state.stage === "playing" ? 0.81 : progress;
  return <dialog ref={dialog} className="intro-dialog crease-experience" aria-labelledby="intro-title" onCancel={event => { event.preventDefault(); finish(); }} data-stage={state.stage} data-renderer={use3d ? "3d" : "2d"}>
    <div className={`intro-shell ${state.stage === "role" ? "intro-choice" : `intro-field ${use3d ? "immersive-field live-match-field" : ""} ${state.stage === "playing" ? "field-playing" : ""}`}`}>
      <div className="intro-top"><div className="editable-brand"><a className="brand" href="#home" onClick={finish}><SiteImage slotId="brand-logo" src={images.crest} width={35} height={42} alt="" /><span>{academy.shortName}<small>CRICKET ACADEMY</small></span></a><EditPhotoButton slotId="brand-logo" label="Introduction logo" /></div><div><button className="intro-control" onClick={toggleSound} aria-pressed={!muted}>{muted ? "Sound off" : "Sound on"}</button><button className="intro-control skip-intro" onClick={finish}>Skip intro <span aria-hidden="true">↗</span></button></div></div>
      {state.stage === "role" ? <div className="role-content"><p className="eyebrow">EVERY GREAT INNINGS STARTS WITH A CHOICE</p><h2 id="intro-title" ref={title} tabIndex={-1}>What do you<br />want to <em>become?</em></h2><p className="intro-subtitle">Two disciplines. One beautiful game. Find your starting point.</p><div className="role-grid">
        <div className="editable-role"><button className="role-card role-batsman" onClick={() => dispatch({ type: "ROLE", role: "batsman" })}><SiteImage slotId="intro-batsman" src="/images/virat-kohli.jpg" alt="Softly blurred portrait of Virat Kohli" fill sizes="(max-width: 600px) 100vw, 45vw" priority /><span className="role-number">01 / THE ART OF TIMING</span><span className="role-description"><strong>Batsman <span aria-hidden="true">↗</span></strong><span>Master technique, timing, shot selection<br />and the confidence to own the crease.</span></span><span className="role-inspiration"><PhotoCredit slotId="intro-batsman" fallback="Virat Kohli · Inspirational image" /></span></button><EditPhotoButton slotId="intro-batsman" label="Batsman introduction portrait" className="media-edit-overlay" /></div>
        <div className="editable-role"><button className="role-card role-bowler" onClick={() => dispatch({ type: "ROLE", role: "bowler" })}><SiteImage slotId="intro-bowler" src="/images/shane-warne.jpg" alt="Softly blurred portrait of Shane Warne" fill sizes="(max-width: 600px) 100vw, 45vw" priority /><span className="role-number">02 / THE CRAFT OF CONTROL</span><span className="role-description"><strong>Bowler <span aria-hidden="true">↗</span></strong><span>Develop pace, movement, accuracy<br />and the skill to change the game.</span></span><span className="role-inspiration"><PhotoCredit slotId="intro-bowler" fallback="Shane Warne · Inspirational image" /></span></button><EditPhotoButton slotId="intro-bowler" label="Bowler introduction portrait" className="media-edit-overlay" /></div>
      </div><p className="intro-footnote">Built-in portraits are licensed inspirational images. No endorsement or academy affiliation.<br />Built-in Kohli: Anand Anil / CC BY-SA 4.0 · Warne: Tourism Victoria / CC BY 2.0. <a href={sitePath("/credits/")}>Credits ↗</a></p></div> : <div className="field-layout">
        <div className="field-panel"><div className={`field-render ${use3d && ready ? "has-three" : ""}`}>
          <div className={`fallback-surface ${!use3d && state.stage === "playing" && !reduced ? "fallback-perspective" : ""}`}><FieldFallback technique={state.technique} progress={renderProgress} role={state.role!} /></div>
          {use3d && <SceneBoundary onFailure={failure}><Suspense fallback={null}><FieldScene technique={state.technique} progress={renderProgress} role={state.role!} onReady={sceneReady} onFailure={failure} selectedZone={selectedZone} onZone={setSelectedZone} overview={overview} paused={previewPaused} highQuality={highQuality} /></Suspense></SceneBoundary>}
          {use3d && !ready && <div className="scene-loading" role="status"><span className="loading-ball" />Preparing the 3D field. 2D fallback remains available.</div>}
        </div>{use3d && state.stage === "select" && <div className="match-view-controls"><button onClick={() => setOverview(!overview)} aria-pressed={overview}>{overview ? "Match camera" : "Field overview"}</button><button onClick={() => setPreviewPaused(!previewPaused)} aria-pressed={previewPaused}>{previewPaused ? "Play match preview" : "Pause match preview"}</button><button onClick={() => setHighQuality(!highQuality)} aria-pressed={highQuality}>{highQuality ? "Clarity: high" : "Clarity: balanced"}</button></div>}<p className="field-assumption">Right-arm bowler / right-handed batter<br />Original characters. Procedural motion, not captured match footage.</p>
        <details className="field-legend-details"><summary>Field positions & orientation</summary><div className="field-legend">{fieldLabels.map(label => <button aria-pressed={selectedZone === label.name} onClick={() => setSelectedZone(label.name)} className={state.technique?.zone === label.name ? "active" : ""} key={label.name}>{label.name}</button>)}</div>{selectedZone && <p>{selectedZone} · {fieldLabels.find(label => label.name === selectedZone)!.x < 0 ? "Off side (left)" : selectedZone === "Straight" ? "Straight ahead" : "Leg side (right)"} in the overhead view.</p>}</details>
        </div><div className="technique-panel"><button className="intro-back" onClick={() => { dispatch({ type: "BACK" }); setProgress(0); setReady(false); }}>← Change role</button><p className="eyebrow">{state.role === "batsman" ? "THE BATSMAN'S JOURNEY" : "THE BOWLER'S JOURNEY"}</p><h2 id="intro-title" ref={title} tabIndex={-1}>{state.stage === "select" ? state.role === "batsman" ? <>What is your<br /><em>favourite shot?</em></> : <>What type of bowler<br />will you <em>become?</em></> : state.technique?.name}</h2>
          {state.stage === "select" ? <><p className="intro-subtitle">{state.role === "batsman" ? "Read the delivery. Find your timing. Choose a stroke for a full broadcast sequence." : "Right arm over. Set your approach and watch the batter respond to your delivery."}</p><div className="technique-grid">{selection.map(technique => <button key={technique.id} onClick={() => { setProgress(0); dispatch({ type: "TECHNIQUE", id: technique.id, choices: selection }); }}><span aria-hidden="true">{technique.arrow}</span><span>{technique.name}<small>{technique.zone}</small></span></button>)}</div>{selectedZone && <p className="selected-region">Exploring: {selectedZone}{shots.some(shot => shot.zone === selectedZone) ? ` · Try ${shots.filter(shot => shot.zone === selectedZone).map(shot => shot.name).join(" or ")}` : " · An approximate fielding region"}</p>}{state.role === "bowler" && <p className="intro-footnote">All six actions are right-arm. Spin turns after pitching; swing curves in flight.</p>}</> : <>
            <p className="shot-cue">{state.technique?.cue}</p><div className="animation-status" role="status">{state.technique && (reduced ? "Reduced-motion view · selected trajectory" : use3d ? progress < 0.38 ? "Approach & right-arm release" : progress < 0.57 ? "Read the bounce" : "Stroke & follow-through" : phaseLabel(state.technique, progress))}</div><progress aria-label="Cricket sequence progress" value={reduced ? 1 : progress} max={1} />
            {reduced && <button className="button button-cream" onClick={finish}>Enter the academy ↗</button>}
            {use3d && <p className="camera-caption">{progress < 0.13 ? "CREASE CLOSE-UP" : progress < 0.6 ? "BOWLER-END BROADCAST" : "OUTFIELD TRACKING"}</p>}
            <button className="intro-control" onClick={() => { dispatch({ type: "BACK" }); dispatch({ type: "ROLE", role: state.role! }); setProgress(0); }}>Choose another {state.role === "batsman" ? "shot" : "delivery"}</button>
          </>}
          <div className="experience-controls">{webgl && !reduced ? <button className="intro-control" onClick={() => { setReady(false); setSceneFailed(false); setEnhanced(sceneFailed || !enhanced); }}>{sceneFailed ? "Retry enhanced 3D" : enhanced ? "Use lightweight 2D" : "Use enhanced 3D"}</button> : <span>{reduced ? "Reduced motion respected" : "Lightweight 2D experience"}</span>}<small>{sceneFailed ? "3D unavailable. Continuing with the complete 2D experience." : !webgl ? "WebGL unavailable. Every shot and delivery still works." : "Anatomical rig · original motion, not motion capture"}</small></div>
        </div>
      </div>}
      {(audioError || storageNotice) && <p className="intro-notice" role="status">{audioError || storageNotice}</p>}
      {ballTransition && <motion.div className="crease-outro" aria-hidden="true" style={{ opacity: Math.min(1, (progress - 0.94) / 0.04) }}><span>YOUR NEXT INNINGS STARTS HERE</span><strong>{academy.name}</strong></motion.div>}
      {state.stage !== "role" && <div className="intro-bottom"><span>{state.stage === "select" ? "SELECT YOUR CRAFT" : "YOUR JOURNEY HAS BEGUN"}</span><span>01 — 02 — 03</span></div>}
    </div>
  </dialog>;
}
