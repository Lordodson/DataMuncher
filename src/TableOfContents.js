import React, { useEffect, useState } from 'react';
import './TableOfContents.css';

const TableOfContents = () => {
    const [headings, setHeadings] = useState([]);

    useEffect(() => {
        const elements = Array.from(document.querySelectorAll('h2, h3'));
        const headingsArray = elements.map((elem) => ({
            id: elem.id,
            text: elem.innerText,
            level: elem.tagName,
        }));
        setHeadings(headingsArray);
    }, []);

    return (
        <nav className="toc">
            <h1>Table of Contents</h1>
            <ul>
                {headings.map((heading) => (
                    <li key={heading.id} className={`toc-${heading.level.toLowerCase()}`}>
                        <a href={`#${heading.id}`} className="toc-link">{heading.text}</a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default TableOfContents;