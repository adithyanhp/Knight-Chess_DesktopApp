import React, { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flag,
  Lightbulb,
  MessageCircle,
  Send,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { LESSONS, LEARNING_STAGES } from "../data/lessons";
import { Avatar } from "./Piece";
import "./learning.css";

const ADVICE = {
  opening: {
    title: "Make every opening move useful.",
    answer:
      "Start with three priorities: control the center, develop your minor pieces, and secure your king. Before you move, ask which priority the move serves. If your opponent creates a direct threat, handle it first. A good exercise is to play ten opening moves, then count how many pieces each side has developed.",
    lesson: "opening-principles",
    prompt: "How should I play the opening?",
  },
  blunders: {
    title: "Build a ten-second safety habit.",
    answer:
      "After your opponent moves, ask: what changed, and what are they threatening? Choose your move, then imagine it on the board. Check the opponent’s checks and captures once more before playing. Review your last game and identify the first missed threat. Train that pattern slowly before trying it in faster games.",
    lesson: "piece-values",
    prompt: "How do I stop losing pieces?",
  },
  tactics: {
    title: "Calculate the whole idea.",
    answer:
      "Look first for checks, captures, and direct threats. Choose a candidate and calculate the opponent’s strongest response. Do not move as soon as you recognize a familiar pattern: verify that the opponent cannot capture the attacking piece or create a stronger threat. A few puzzles solved carefully are more useful than many guesses.",
    lesson: "candidate-moves",
    prompt: "How can I improve my tactics?",
  },
  endgame: {
    title: "Bring your king into the game.",
    answer:
      "In many endings, king activity is the first thing to improve. Identify passed pawns, potential entry squares, and the opponent’s counterplay. In rook endings, seek activity rather than defending every pawn passively. Practice a basic king-and-pawn ending from both sides and explain why each move matters.",
    lesson: "king-pawn-endings",
    prompt: "What should I study in endgames?",
  },
  plan: {
    title: "Find the least useful piece.",
    answer:
      "When there is no immediate tactic, compare king safety, piece activity, pawn structure, and space. Identify your least useful piece and imagine a better square for it. Then check what your opponent wants to do. A sound plan improves your position while respecting their threats and pawn breaks.",
    lesson: "pawn-structures",
    prompt: "How do I find a plan?",
  },
  review: {
    title: "Review the decision, not just the mistake.",
    answer:
      "Replay your game without analysis first. Write down the moves where you felt uncertain and the alternatives you considered. Then compare with the review. Pick one recurring issue—such as undefended pieces or time pressure—and make that your focus for the next few games.",
    lesson: "analyze-your-games",
    prompt: "How should I review my games?",
  },
  time: {
    title: "Save your time for critical moments.",
    answer:
      "Use a consistent routine: assess the opponent’s last move, identify threats, select candidates, calculate, then check your choice. Spend more time on irreversible decisions and tactical positions. In quiet positions, a reasonable improving move is often enough. Start with a 15- or 20-minute game so you can practice this habit.",
    lesson: "practical-decisions",
    prompt: "How do I manage my clock?",
  },
};

function selectAdvice(question) {
  const q = question.toLowerCase();
  if (/open|sicilian|french|caro|italian|defen[cs]e|repertoire/.test(q))
    return ADVICE.opening;
  if (/endgame|ending|pawn.*king|rook ending|promotion/.test(q))
    return ADVICE.endgame;
  if (/blunder|losing pieces|hang|mistake|lose.*piece/.test(q))
    return ADVICE.blunders;
  if (/tactic|puzzle|calcul|fork|pin|mate/.test(q)) return ADVICE.tactics;
  if (/clock|time|rapid|blitz/.test(q)) return ADVICE.time;
  if (/review|analy|game/.test(q)) return ADVICE.review;
  return ADVICE.plan;
}

export default function Coach({
  completedLessons = [],
  onLesson = () => {},
  onPractice = () => {},
}) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const completed = useMemo(
    () => new Set(completedLessons || []),
    [completedLessons],
  );
  const nextLesson =
    LESSONS.find((lesson) => !completed.has(lesson.id)) ||
    LESSONS[LESSONS.length - 1];
  const completedCount = LESSONS.filter((lesson) =>
    completed.has(lesson.id),
  ).length;

  function ask(text) {
    const clean = text.trim();
    if (!clean) return;
    setConversation((previous) => [
      ...previous.slice(-7),
      { question: clean, advice: selectAdvice(clean) },
    ]);
    setQuestion("");
  }

  return (
    <section className="academy-page coach-page">
      <header className="academy-page-heading">
        <div>
          <span className="academy-eyebrow">YOUR PERSONAL TRAINING ROOM</span>
          <h1>Find the idea behind the move.</h1>
          <p>
            A thoughtful practice plan, from your first game to advanced study.
          </p>
        </div>
        <span className="academy-heading-icon">
          <Sparkles size={29} />
        </span>
      </header>
      <div className="coach-intro">
        <div className="coach-avatar-art">
          <Avatar
            name="Magnus-inspired training companion"
            bot="magnus"
            size={112}
          />
          <small>THE TRAINING ROOM</small>
        </div>
        <div className="coach-intro-copy">
          <span className="academy-eyebrow">
            MAGNUS CARLSEN–INSPIRED COACHING
          </span>
          <h2>
            Small improvements.
            <br />
            Stronger chess.
          </h2>
          <p>
            Explore practical play, active pieces, and endgame technique with a
            structured training companion.
          </p>
          <span className="coach-disclaimer">
            Independent training companion · not affiliated with Magnus Carlsen
          </span>
        </div>
        <div className="coach-today">
          <span className="academy-eyebrow">TODAY’S FOCUS</span>
          <strong>{nextLesson.title}</strong>
          <span>{nextLesson.duration} minutes of focused learning</span>
          <button
            className="academy-primary"
            onClick={() => onLesson(nextLesson.id)}
          >
            Begin lesson <BookOpen size={16} />
          </button>
        </div>
      </div>
      <div className="coach-content-grid">
        <div className="coach-main-column">
          <section className="coach-chat">
            <div className="academy-section-heading">
              <h2>
                <MessageCircle size={21} /> Let’s talk chess
              </h2>
              <span className="academy-small-label">Guided topic advice</span>
            </div>
            <p className="coach-chat-intro">
              Choose a topic or describe what you’re working on. These prepared
              training tips point you toward a useful next lesson.
            </p>
            <div className="coach-prompts">
              {Object.values(ADVICE)
                .slice(0, 5)
                .map((advice) => (
                  <button
                    key={advice.prompt}
                    onClick={() => ask(advice.prompt)}
                  >
                    {advice.prompt}
                  </button>
                ))}
            </div>
            <div className="coach-conversation" aria-live="polite">
              {conversation.length === 0 ? (
                <div className="coach-welcome">
                  <span className="coach-message-avatar">
                    <Lightbulb size={20} />
                  </span>
                  <div>
                    <strong>Start with one thing you want to improve.</strong>
                    <p>
                      We’ll connect it to a clear idea and a focused practice
                      step.
                    </p>
                  </div>
                </div>
              ) : (
                conversation.map((entry, index) => (
                  <div
                    className="coach-exchange"
                    key={`${entry.question}-${index}`}
                  >
                    <div className="coach-user-message">{entry.question}</div>
                    <div className="coach-response">
                      <span className="coach-message-avatar">
                        <Lightbulb size={20} />
                      </span>
                      <div>
                        <h3>{entry.advice.title}</h3>
                        <p>{entry.advice.answer}</p>
                        <button
                          className="coach-lesson-link"
                          onClick={() => onLesson(entry.advice.lesson)}
                        >
                          <BookOpen size={15} />
                          Explore this lesson <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              className="coach-input"
              onSubmit={(event) => {
                event.preventDefault();
                ask(question);
              }}
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about openings, tactics, plans..."
                aria-label="Ask the training companion"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!question.trim()}
                aria-label="Ask question"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="coach-chat-note">
              Topic-based guidance. For a specific position, use Game Review.
            </p>
          </section>
          <section className="coach-habits">
            <h2>A simple training rhythm</h2>
            <div className="coach-habit-row">
              <span>
                <Target size={20} />
              </span>
              <div>
                <strong>See the pattern</strong>
                <p>Solve a few puzzles carefully. Calculate before you move.</p>
              </div>
              <button onClick={() => onPractice()}>Practice</button>
            </div>
            <div className="coach-habit-row">
              <span>
                <BookOpen size={20} />
              </span>
              <div>
                <strong>Understand one idea</strong>
                <p>
                  Take a short lesson and explain the idea in your own words.
                </p>
              </div>
              <button onClick={() => onLesson(nextLesson.id)}>Learn</button>
            </div>
            <div className="coach-habit-row">
              <span>
                <Flag size={20} />
              </span>
              <div>
                <strong>Put it into play</strong>
                <p>Play thoughtfully, review a critical moment, and repeat.</p>
              </div>
            </div>
          </section>
        </div>
        <aside className="coach-path">
          <div className="academy-section-heading">
            <h2>Your journey</h2>
            <Trophy size={21} />
          </div>
          <p>
            {completedCount} of {LESSONS.length} lessons completed
          </p>
          <div className="academy-progress-track">
            <span
              style={{ width: `${(completedCount / LESSONS.length) * 100}%` }}
            />
          </div>
          <div className="coach-stage-list">
            {LEARNING_STAGES.map((stage, index) => {
              const items = LESSONS.filter(
                (lesson) => lesson.stage === stage.id,
              );
              const count = items.filter((lesson) =>
                completed.has(lesson.id),
              ).length;
              const next =
                items.find((lesson) => !completed.has(lesson.id)) || items[0];
              const done = count === items.length;
              return (
                <button
                  key={stage.id}
                  className={`coach-stage ${nextLesson.stage === stage.id ? "is-current" : ""}`}
                  onClick={() => onLesson(next.id)}
                >
                  <span className="coach-stage-node">
                    {done ? <CheckCircle2 size={20} /> : index + 1}
                  </span>
                  <div>
                    <span className="academy-eyebrow">{stage.level}</span>
                    <h3>{stage.label}</h3>
                    <p>{stage.description}</p>
                    <small>
                      {count}/{items.length} lessons
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="coach-path-note">
            <Lightbulb size={19} />
            <p>
              Move at your own pace. Every lesson is available from the start.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
