import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Mic, Check, X, MapPin, Tag, User } from 'lucide-react';

const QuickAdd = () => {
    const navigate = useNavigate();
    const { addConnection } = useData();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    const [name, setName] = useState('');

    // Optional fields hidden behind "Show More" or just inferred later
    const [notes, setNotes] = useState('');

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Browser does not support speech recognition. Try Chrome.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            // Heuristic: If we don't have a name yet, assume first few words might be name, 
            // but for now just put it all in notes for safety.
            setNotes(prev => prev ? `\${prev}\n\n[Voice]: \${text}` : text);
        };

        recognition.start();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Minimal validation: Name is the only "key".
        if (!name.trim()) return;

        addConnection({
            name,
            notes, // "People note" not "record"
            type: 'peer', // Default
            howMet: 'Quick Add',
            frequency: 90,
            location: '',
            role: '',
            company: '',
            tags: []
        });
        navigate('/');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Quick Add</h1>

            <div className="card" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>

                    {/* The One Mandatory Field */}
                    <div style={{ position: 'relative' }}>
                        <User size={20} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: 'var(--color-text-secondary)' }} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                fontSize: '1.5rem',
                                padding: '1rem 1rem 1rem 3rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '2px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>

                    {/* Voice Capture Zone */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                            Quick Notes (Voice or Text)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                placeholder="Met at coffee shop. He is looking for a co-founder..."
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)',
                                    resize: 'vertical'
                                }}
                            />
                            <button
                                type="button"
                                onClick={startListening}
                                style={{
                                    position: 'absolute',
                                    bottom: '1rem',
                                    right: '1rem',
                                    backgroundColor: isListening ? '#ef4444' : 'var(--color-accent-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}
                                title="Dictate Note"
                            >
                                <Mic size={20} className={isListening ? 'pulse' : ''} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                            * Only name is required. Add details later.
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!name.trim()}
                            style={{
                                padding: '1rem 2rem',
                                fontSize: '1.125rem',
                                borderRadius: 'var(--radius-lg)',
                                opacity: !name.trim() ? 0.5 : 1
                            }}
                        >
                            <Check size={20} style={{ marginRight: '8px' }} />
                            Save Connection
                        </button>
                    </div>

                </form>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                .pulse {
                    animation: pulse 1.5s infinite;
                }
            `}</style>
        </div>
    );
};

export default QuickAdd;
