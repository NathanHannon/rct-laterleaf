import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import './StaticPage.scss';

const pages = [
    ['/about', 'About'],
    ['/contact', 'Contact'],
    ['/faq', 'FAQ'],
    ['/privacy', 'Privacy policy'],
    ['/terms', 'Terms of service'],
    ['/report-abuse', 'Report abuse'],
];

interface StaticPageProps {
    title: string;
    eyebrow: string;
    className?: string;
    children: ReactNode;
}

export default function StaticPage({ title, eyebrow, className = '', children }: StaticPageProps) {
    return (
        <div className={`static-page ${className}`}>
            <header className="static-page-heading">
                <p className="static-page-eyebrow"><span aria-hidden="true">❧</span> {eyebrow}</p>
                <h1>{title}</h1>
            </header>
            <div className="static-page-layout">
                <nav className="static-page-nav" aria-label="About and support">
                    <p>LaterLeaf / A closer look</p>
                    {pages.map(([to, label], index) => (
                        <NavLink key={to} to={to} end>
                            <span aria-hidden="true">0{index + 1}</span>{label}
                        </NavLink>
                    ))}
                </nav>
                <article className="static-page-body">{children}</article>
            </div>
        </div>
    );
}
