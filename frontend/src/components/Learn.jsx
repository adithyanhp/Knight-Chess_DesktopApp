import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Lightbulb,
  Play,
  Search,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { LESSONS, LEARNING_STAGES } from "../data/lessons";
import "./learning.css";

const categoryIcons = {
  Fundamentals: BookOpen,
  Tactics: Target,
  Openings: Play,
  Endgames: Trophy,
  Strategy: Lightbulb,
  Calculation: Sparkles,
};

export default function Learn({
  completedLessons = [],
  onComplete = () => {},
  onPractice = () => {},
  initialLessonId,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All lessons");
  const [stage, setStage] = useState("all");
  const [selected, setSelected] = useState(
    () => LESSONS.find((lesson) => lesson.id === initialLessonId) || null,
  );
  const [answer, setAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const completed = useMemo(
    () => new Set(completedLessons || []),
    [completedLessons],
  );
  const totalCompleted = LESSONS.filter((lesson) =>
    completed.has(lesson.id),
  ).length;
  const nextLesson =
    LESSONS.find((lesson) => !completed.has(lesson.id)) || LESSONS[0];
  const filtered = LESSONS.filter(
    (lesson) =>
      (category === "All lessons" || lesson.category === category) &&
      (stage === "all" || lesson.stage === stage) &&
      `${lesson.title} ${lesson.summary} ${lesson.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (initialLessonId)
      setSelected(
        LESSONS.find((lesson) => lesson.id === initialLessonId) || null,
      );
  }, [initialLessonId]);
  useEffect(() => {
    setAnswer(null);
    setSubmitted(false);
  }, [selected?.id]);

  function finishLesson() {
    setSubmitted(true);
    if (answer === selected.quiz.correct && !completed.has(selected.id))
      onComplete(selected.id);
  }

  if (selected) {
    const Icon = categoryIcons[selected.category] || BookOpen;
    const passed = submitted && answer === selected.quiz.correct;
    const next = LESSONS[selected.index + 1];
    return (
      <section className="academy-page academy-reader-page">
        <button className="academy-back" onClick={() => setSelected(null)}>
          <ChevronLeft size={17} /> All lessons
        </button>
        <div className="academy-reader-layout">
          <article className="academy-reader">
            <div className="academy-reader-topline">
              <span className="academy-category">
                <Icon size={15} />
                {selected.category}
              </span>
              <span>
                {selected.level} · {selected.duration} min
              </span>
            </div>
            <h1>{selected.title}</h1>
            <p className="academy-reader-summary">{selected.summary}</p>
            <div className="academy-lesson-copy">
              {selected.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="academy-takeaway">
              <Lightbulb size={23} />
              <div>
                <strong>Keep this in mind</strong>
                <p>{selected.takeaway}</p>
              </div>
            </div>
            <section
              className="academy-quiz"
              aria-label="Lesson knowledge check"
            >
              <span className="academy-eyebrow">CHECK YOUR UNDERSTANDING</span>
              <h2>{selected.quiz.question}</h2>
              <div className="academy-quiz-options">
                {selected.quiz.options.map((option, index) => (
                  <button
                    key={option}
                    className={`academy-quiz-option ${answer === index ? "is-selected" : ""} ${submitted && index === selected.quiz.correct ? "is-correct" : ""} ${submitted && answer === index && index !== selected.quiz.correct ? "is-incorrect" : ""}`}
                    aria-pressed={answer === index}
                    onClick={() => {
                      setAnswer(index);
                      setSubmitted(false);
                    }}
                  >
                    <span className="academy-answer-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                    {submitted && index === selected.quiz.correct && (
                      <Check size={18} />
                    )}
                  </button>
                ))}
              </div>
              {submitted && (
                <div
                  className={`academy-quiz-feedback ${passed ? "is-correct" : ""}`}
                  role="status"
                >
                  <strong>
                    {passed ? "Well played." : "Take another look."}
                  </strong>{" "}
                  {selected.quiz.explanation}
                </div>
              )}
              <div className="academy-reader-actions">
                {passed || completed.has(selected.id) ? (
                  <>
                    <span className="academy-completed">
                      <CheckCircle2 size={18} /> Lesson complete
                    </span>
                    {next && (
                      <button
                        className="academy-primary"
                        onClick={() => setSelected(next)}
                      >
                        Next lesson <ChevronRight size={17} />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className="academy-primary"
                    disabled={answer === null}
                    onClick={finishLesson}
                  >
                    Check answer
                  </button>
                )}
              </div>
            </section>
          </article>
          <aside className="academy-reader-aside">
            <div className="academy-side-card">
              <GraduationCap size={28} />
              <h3>Make it a habit</h3>
              <p>
                A few focused minutes every day can make your next game feel
                different.
              </p>
              <button
                className="academy-secondary"
                onClick={() => onPractice(selected.fen)}
              >
                Practice on the board
              </button>
            </div>
            <div className="academy-side-card">
              <h3>Your learning path</h3>
              <div className="academy-progress-track">
                <span
                  style={{
                    width: `${(totalCompleted / LESSONS.length) * 100}%`,
                  }}
                />
              </div>
              <p>
                {totalCompleted} of {LESSONS.length} lessons completed
              </p>
              <div className="academy-mini-path">
                {LEARNING_STAGES.map((item) => (
                  <div key={item.id}>
                    <span
                      className={`academy-mini-dot ${item.id === selected.stage ? "is-current" : ""}`}
                    />
                    <span>{item.level}</span>
                    <small>
                      {
                        LESSONS.filter(
                          (lesson) =>
                            lesson.stage === item.id &&
                            completed.has(lesson.id),
                        ).length
                      }
                      /
                      {
                        LESSONS.filter((lesson) => lesson.stage === item.id)
                          .length
                      }
                    </small>
                  </div>
                ))}
              </div>
            </div>
            {selected.category === "Fundamentals" && (
              <a
                className="academy-source"
                href="https://handbook.fide.com/chapter/E012023"
                target="_blank"
                rel="noreferrer"
              >
                Read the official FIDE Laws of Chess
              </a>
            )}
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="academy-page">
      <header className="academy-page-heading">
        <div>
          <span className="academy-eyebrow">THE LEARNING ROOM</span>
          <h1>A little wiser. Every move.</h1>
          <p>
            Build a strong foundation, then discover how great chess is played.
          </p>
        </div>
        <span className="academy-heading-icon">
          <GraduationCap size={31} />
        </span>
      </header>
      <div className="academy-learning-hero">
        <div>
          <span className="academy-eyebrow">YOUR NEXT LESSON</span>
          <h2>{nextLesson.title}</h2>
          <p>{nextLesson.summary}</p>
          <button
            className="academy-primary"
            onClick={() => setSelected(nextLesson)}
          >
            <Play size={17} fill="currentColor" />{" "}
            {totalCompleted ? "Continue learning" : "Start learning"}
          </button>
        </div>
        <div className="academy-progress-summary">
          <div
            className="academy-progress-ring"
            style={{
              "--progress": `${(totalCompleted / LESSONS.length) * 100}%`,
            }}
          >
            <span>
              {totalCompleted}
              <small>of {LESSONS.length}</small>
            </span>
          </div>
          <strong>Lessons completed</strong>
          <span>Your pace. Your progress.</span>
        </div>
      </div>
      <div className="academy-library-heading">
        <h2>
          Explore the lessons <span>{LESSONS.length}</span>
        </h2>
        <div className="academy-search">
          <Search size={17} />
          <input
            aria-label="Search lessons"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a topic..."
          />
        </div>
      </div>
      <div className="academy-filter-row">
        <div className="academy-filter-tabs">
          {[
            "All lessons",
            "Fundamentals",
            "Tactics",
            "Openings",
            "Endgames",
            "Strategy",
            "Calculation",
          ].map((item) => (
            <button
              className={category === item ? "is-active" : ""}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="academy-level-filter">
          <span className="academy-sr-only">Difficulty level</span>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
          >
            <option value="all">All levels</option>
            {LEARNING_STAGES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.level}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="academy-lesson-grid">
          {filtered.map((lesson) => {
            const Icon = categoryIcons[lesson.category] || BookOpen;
            return (
              <button
                className={`academy-lesson-card ${completed.has(lesson.id) ? "is-complete" : ""}`}
                key={lesson.id}
                onClick={() => setSelected(lesson)}
              >
                <div
                  className="academy-lesson-visual"
                  data-category={lesson.category}
                >
                  <Icon size={40} strokeWidth={1.5} />
                  <span className="academy-level-tag">{lesson.level}</span>
                  {completed.has(lesson.id) && (
                    <span className="academy-done-mark" aria-label="Completed">
                      <CheckCircle2 size={21} />
                    </span>
                  )}
                  <span className="academy-visual-grid" />
                </div>
                <div className="academy-lesson-card-body">
                  <span className="academy-card-category">
                    {lesson.category}
                  </span>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.summary}</p>
                  <div className="academy-card-footer">
                    <span>
                      <Clock3 size={14} />
                      {lesson.duration} min
                    </span>
                    <span>
                      {completed.has(lesson.id)
                        ? "Revisit lesson"
                        : "Explore lesson"}
                      <ChevronRight size={15} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="academy-empty">
          <Search size={30} />
          <h3>No lessons found</h3>
          <p>Try another topic or reset your filters.</p>
          <button
            className="academy-secondary"
            onClick={() => {
              setQuery("");
              setCategory("All lessons");
              setStage("all");
            }}
          >
            Show all lessons
          </button>
        </div>
      )}
      <p className="academy-footnote">
        A progressive foundation for continued study. Advanced mastery grows
        through practice, game analysis, and individual feedback.
      </p>
    </section>
  );
}
