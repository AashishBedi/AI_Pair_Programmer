import React, { useState, useMemo, CSSProperties } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';

const App = () => {
    const [code, setCode] = useState(
`function calculateFactorial(n) {
  if (n < 0) {
    return "n must be a non-negative number";
  } else if (n === 0) {
    return 1;
  } else {
    return n * calculateFactorial(n);
  }
}`
    );
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeFeature, setActiveFeature] = useState(null);
    const [error, setError] = useState('');

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

    const getPrompt = (feature, codeContent) => {
        const professionalMarkdown = "Your response must be in well-formatted, professional Markdown.";
        switch (feature) {
            case 'explain':
                return `You are an expert code reviewer. ${professionalMarkdown}\n\nFirst, identify the programming language of the following code. Then, provide a clear, structured explanation for it. Use headings for sections and bullet points for lists. Do not repeat the original code in your response.\n\n**Code to explain:**\n\`\`\`\n${codeContent}\n\`\`\``;
            case 'debug':
                return `You are an AI debugging assistant. ${professionalMarkdown}\n\n1. Analyze the following code for bugs or errors.\n2. Provide a corrected version in a Markdown code block, tagged with the correct programming language (e.g., \`\`\`javascript).\n3. Below the code block, provide a bulleted list explaining the fixes.\n4. If no bugs are found, just say so.\n\n**Code with potential bugs:**\n\`\`\`\n${codeContent}\n\`\`\``;
            case 'suggest':
                return `You are an AI pair programmer. ${professionalMarkdown}\n\n1. Suggest an improvement or new feature for the following code.\n2. Provide the new code in a Markdown code block, tagged with the correct programming language (e.g., \`\`\`javascript).\n3. Below the code block, explain your suggestion.\n\n**Existing Code:**\n\`\`\`\n${codeContent}\n\`\`\``;
            default:
                return '';
        }
    };

    const handleFeatureClick = async (feature) => {
        if (!code.trim()) {
            setError('Please enter some code in the editor.');
            setOutput('');
            setActiveFeature(null);
            return;
        }
        setIsLoading(true);
        setActiveFeature(feature);
        setOutput('');
        setError('');

        try {
            const prompt = getPrompt(feature, code);
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setOutput(response.text);
        } catch (err) {
            console.error('AI Error:', err);
            setError('An error occurred while communicating with the AI. Please check the console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    const parsedOutput = useMemo(() => {
        if (!output || (activeFeature !== 'debug' && activeFeature !== 'suggest')) {
            return { explanation: output, codeBlock: null };
        }
        
        const codeBlockRegex = /```.*\n([\s\S]*?)```/;
        const match = output.match(codeBlockRegex);
        
        if (match) {
            const codeBlock = match[1].trim();
            const explanation = output.replace(codeBlockRegex, '').trim();
            return { explanation, codeBlock };
        }
        
        return { explanation: output, codeBlock: null };
    }, [output, activeFeature]);

    const styles: { [key: string]: CSSProperties } = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
        },
        header: {
            textAlign: 'center',
            color: 'var(--primary)',
            margin: '0',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
        },
        editorContainer: {
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
        toolbar: {
            display: 'flex',
            gap: '0.75rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1rem',
        },
        button: {
            flex: 1,
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--surface-light)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem'
        },
        buttonActive: {
            backgroundColor: 'var(--primary)',
            color: 'var(--background)',
            borderColor: 'var(--primary)',
        },
        textarea: {
            width: '100%',
            height: '300px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--foreground)',
            resize: 'vertical',
            fontFamily: "'Fira Code', monospace",
            fontSize: '1rem',
            lineHeight: '1.5',
            outline: 'none',
        },
        outputContainer: {
            backgroundColor: 'var(--surface)',
            borderRadius: '8px',
            padding: '1.5rem',
            border: '1px solid var(--border)',
            minHeight: '100px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
        outputTitle: {
            margin: '0 0 1rem 0',
            color: 'var(--primary-hover)',
            fontSize: '1.1rem',
            textTransform: 'capitalize',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.5rem',
        },
        error: {
            color: 'var(--red)',
        },
        codeBlock: {
            backgroundColor: 'var(--background)',
            padding: '1rem',
            borderRadius: '6px',
            overflowX: 'auto',
            margin: '1rem 0',
            border: '1px solid var(--border)',
            fontFamily: "'Fira Code', monospace",
        },
        useCodeButton: {
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--primary-hover)',
            color: 'var(--background)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 700,
            transition: 'opacity 0.2s ease',
        },
    };

    return (
        <div style={styles.container}>
             <style>{`
                .ai-button:hover:not(:disabled) {
                    background-color: var(--primary);
                    color: var(--background);
                    border-color: var(--primary);
                }
                .ai-button:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                .use-code-button:hover {
                    opacity: 0.85;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .loader-spin {
                    display: inline-block;
                    width: 1em;
                    height: 1em;
                    border: 2px solid currentColor;
                    border-right-color: transparent;
                    border-radius: 50%;
                    animation: spin 0.75s linear infinite;
                }
                .output-content h1, .output-content h2, .output-content h3, .output-content h4 {
                    color: var(--primary-hover);
                    margin-top: 1.25em;
                    margin-bottom: 0.5em;
                    border-bottom: 1px solid var(--border);
                    padding-bottom: 0.3em;
                }
                .output-content p {
                    margin-bottom: 1em;
                }
                .output-content ul, .output-content ol {
                    padding-left: 1.5rem;
                    margin-bottom: 1em;
                }
                .output-content li {
                    margin-bottom: 0.4em;
                }
                .output-content code {
                    background-color: var(--surface-light);
                    color: var(--red);
                    padding: 0.2em 0.4em;
                    border-radius: 4px;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.9em;
                }
                .output-content pre {
                    background-color: var(--background);
                    border: 1px solid var(--border);
                    padding: 1rem;
                    border-radius: 6px;
                    overflow-x: auto;
                    margin: 1em 0;
                }
                .output-content pre code {
                    background-color: transparent;
                    color: inherit;
                    padding: 0;
                    border-radius: 0;
                    font-size: 1em;
                }
                .output-content blockquote {
                    border-left: 4px solid var(--border);
                    padding-left: 1rem;
                    color: var(--comment);
                    margin-left: 0;
                }
            `}</style>
            <h1 style={styles.header}>AI Pair Programmer</h1>
            
            <div style={styles.editorContainer}>
                <div style={styles.toolbar}>
                    {['explain', 'debug', 'suggest'].map((feature) => (
                        <button
                            key={feature}
                            className="ai-button"
                            onClick={() => handleFeatureClick(feature)}
                            disabled={isLoading}
                            style={{
                                ...styles.button,
                                ...((activeFeature === feature && (isLoading || output || error)) ? styles.buttonActive : {})
                            }}
                        >
                            {isLoading && activeFeature === feature ? <span className="loader-spin"></span> : null}
                            <span>{feature.charAt(0).toUpperCase() + feature.slice(1)}</span>
                        </button>
                    ))}
                </div>
                <textarea
                    style={styles.textarea}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your code here..."
                    aria-label="Code Editor"
                />
            </div>

            {(isLoading || output || error) && (
                <div style={styles.outputContainer} role="status" aria-live="polite">
                    {isLoading && <h3 style={styles.outputTitle}>Thinking...</h3>}
                    {error && <p style={styles.error}>{error}</p>}
                    {output && !isLoading && (
                        <div>
                            <h3 style={styles.outputTitle}>{activeFeature} Result</h3>
                            <div
                                className="output-content"
                                style={{lineHeight: 1.6}}
                                dangerouslySetInnerHTML={{ __html: marked.parse(parsedOutput.explanation || '') }}
                            />
                            {parsedOutput.codeBlock && (
                                <>
                                    <pre style={styles.codeBlock}><code>{parsedOutput.codeBlock}</code></pre>
                                    <button
                                        className="use-code-button"
                                        style={styles.useCodeButton}
                                        onClick={() => setCode(parsedOutput.codeBlock)}
                                    >
                                        Use This Code
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
}