import { useState } from 'react';
import { SignUpButton } from '@clerk/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBookmark, faCheck, faSearch } from '@fortawesome/free-solid-svg-icons';
import './HeroPage.scss';

const steps = [
    { label: 'Save', title: 'Keep the good ones.', description: 'Paste an article link or save it from your browser. Give your next good read a home.' },
    { label: 'Read', title: 'Find a moment for it.', description: 'Settle into a clean reading view. Use a summary to decide what deserves a closer look.' },
    { label: 'Find again', title: 'Come back to the idea.', description: 'Find a saved article by its words, or search by an idea with Pro semantic search.' },
];

export default function HeroPage() {
    const [step, setStep] = useState(0);
    return (
        <div className="hero-page">
            <section className="reading-hero" aria-labelledby="hero-title">
                <div className="reading-hero__copy">
                    <p className="hero-eyebrow"><span aria-hidden="true">✳</span> A home for your next good read</p>
                    <h1 id="hero-title">Make time for what <em>caught your eye.</em></h1>
                    <p className="hero-intro">Save the articles you want to come back to. Read without the clutter, get the key points, and find that idea when you need it.</p>
                    <SignUpButton mode="modal"><button className="reading-cta">Start your library <FontAwesomeIcon icon={faArrowRight} /></button></SignUpButton>
                    <p className="hero-footnote">Free to start. No credit card required.</p>
                    <a className="hero-tour-link" href="#how-it-works">Take a look inside <span aria-hidden="true">↘</span></a>
                </div>
                <div className="reading-preview" aria-label="Illustrative article preview">
                    <div className="preview-topline"><span>LATERLEAF / YOUR LIBRARY</span><FontAwesomeIcon icon={faBookmark} /></div>
                    <div className="preview-art" aria-hidden="true">
                        <svg viewBox="0 0 400 200" fill="none">
                            <circle cx="288" cy="60" r="35" fill="currentColor" opacity=".13" />
                            <path d="M104 207C137 160 178 110 260 24M160 137C114 132 100 87 111 54C151 64 173 93 160 137ZM186 107C197 68 231 67 265 75C247 110 218 127 186 107ZM216 74C191 51 198 19 211 3C238 22 236 47 216 74Z" stroke="currentColor" strokeWidth="2" />
                            <path d="M64 181H337" stroke="currentColor" strokeOpacity=".25" />
                        </svg>
                        <span>SPACE TO THINK</span>
                    </div>
                    <div className="preview-article">
                        <p className="preview-kicker">Sample article · 4 min read</p>
                        <h2>The quiet pleasure of paying attention</h2>
                        <p>A walk without headphones. A page without interruptions. Sometimes the smallest pauses give an idea room to grow.</p>
                        <div className="preview-saved"><FontAwesomeIcon icon={faCheck} /> Saved for a slower moment</div>
                    </div>
                    <div className="preview-margin-note">Good things are worth coming back to.</div>
                </div>
            </section>
            <section className="reading-journey" id="how-it-works" aria-labelledby="journey-title">
                <div className="journey-heading"><p className="hero-eyebrow">From an open tab to a lasting idea</p><h2 id="journey-title">A place to save. A reason to return.</h2></div>
                <div className="journey-layout">
                    <div className="journey-steps" aria-label="Explore the reading journey">
                        {steps.map((item, index) => (
                            <button key={item.label} type="button" className={`journey-step ${step === index ? 'is-selected' : ''}`} aria-pressed={step === index} aria-controls="journey-example" onClick={() => setStep(index)}>
                                <span className="step-number">0{index + 1}</span><span><strong>{item.label}</strong><span>{item.description}</span></span><FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                    <div className="journey-example" id="journey-example" aria-live="polite" aria-atomic="true">
                        <p className="preview-kicker">Illustrative walkthrough / 0{step + 1}</p><h3>{steps[step].title}</h3>
                        {step === 0 && <><div className="example-url">example.com/a-little-more-attention <FontAwesomeIcon icon={faCheck} /></div><div className="example-result"><FontAwesomeIcon icon={faBookmark} /><div><strong>The quiet pleasure of paying attention</strong><span>In your library, ready when you are.</span></div></div></>}
                        {step === 1 && <div className="example-summary"><span className="example-label">The key idea · sample summary</span><p>Small, deliberate pauses help us notice more. Make room for an uninterrupted walk or a few pages of reading.</p><span className="example-note">Start with the key points. Stay for the full story.</span></div>}
                        {step === 2 && <><div className="example-url"><FontAwesomeIcon icon={faSearch} /><span>making room for quiet moments</span></div><p className="example-label">An example of Pro semantic search</p><div className="example-result"><FontAwesomeIcon icon={faBookmark} /><div><strong>The quiet pleasure of paying attention</strong><span>The article behind the idea you remembered.</span></div></div></>}
                    </div>
                </div>
            </section>
            <section className="reading-details" aria-label="Ways to make your library your own">
                <div><span className="detail-number">01 / YOUR PACE</span><h3>Read it your way.</h3><p>Choose your reading font and theme. Make a little space for a longer read.</p></div>
                <div><span className="detail-number">02 / YOUR COLLECTION</span><h3>Keep a thread of thought.</h3><p>Group related reads in collections and mark favorites you want to revisit.</p></div>
                <div><span className="detail-number">03 / A LITTLE HELP</span><h3>Go further with Pro.</h3><p>Explore semantic search, article conversations, and audio overviews when you want more.</p></div>
            </section>
            <section className="reading-invitation"><p className="hero-eyebrow">Your next good read is waiting</p><h2>Start with one article.</h2><SignUpButton mode="modal"><button className="reading-cta">Create your free library <FontAwesomeIcon icon={faArrowRight} /></button></SignUpButton><p>Save unlimited articles on the free plan.</p></section>
        </div>
    );
}
