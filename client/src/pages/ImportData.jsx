import React, { useState } from 'react';
import Papa from 'papaparse';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const ImportData = () => {
    const navigate = useNavigate();
    const { bulkAddConnections } = useData();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [error, setError] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('Please upload a valid CSV file.');
                return;
            }
            setFile(selectedFile);
            setError('');
            parseFile(selectedFile);
        }
    };

    const parseFile = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    // LinkedIn CSV export format mapping
                    // Usually: First Name, Last Name, URL, Company, Position, Connected On
                    const mapped = results.data.map(row => {
                        // Basic validation/mapping logic
                        const firstName = row['First Name'] || '';
                        const lastName = row['Last Name'] || '';
                        return {
                            name: `${firstName} ${lastName}`.trim(),
                            company: row['Company'] || '',
                            role: row['Position'] || '',
                            email: row['Email Address'] || '', // LinkedIn often hides this now, but if present
                            tags: ['imported'],
                            frequency: '90' // Default check-in for imported
                        };
                    }).filter(c => c.name); // Filter out empty rows

                    setPreview(mapped);
                } else {
                    setError('No data found in file.');
                }
            },
            error: (err) => {
                setError('Error parsing CSV: ' + err.message);
            }
        });
    };

    const handleImport = () => {
        setIsImporting(true);
        // Simulate small delay for UX
        setTimeout(() => {
            bulkAddConnections(preview);
            navigate('/connections');
        }, 1000);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Import Connections</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                Upload your connections export file from LinkedIn (`Connections.csv`).
                <br />
                <small>Go to LinkedIn Settings &gt; Data Privacy &gt; Get a copy of your data &gt; Connections.</small>
            </p>

            {!file ? (
                <div style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-bg-secondary)',
                    cursor: 'pointer',
                    position: 'relative'
                }}>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        style={{
                            opacity: 0,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer'
                        }}
                    />
                    <Upload size={48} style={{ color: 'var(--color-accent-primary)', marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Click to Upload CSV</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>or drag and drop here</p>
                    {error && <div style={{ color: '#ef4444', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}</div>}
                </div>
            ) : (
                <div>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <FileText size={24} style={{ color: 'var(--color-accent-primary)', marginRight: '10px' }} />
                                <div>
                                    <h3 style={{ fontWeight: '600' }}>{file.name}</h3>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{preview.length} connections found</span>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); setPreview([]); }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem' }}
                            >
                                Remove
                            </button>
                        </div>

                        {/* Preview Table */}
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead style={{ backgroundColor: 'var(--color-bg-primary)', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>Name</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>Company</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 50).map((c, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.75rem' }}>{c.name}</td>
                                            <td style={{ padding: '0.75rem' }}>{c.company}</td>
                                            <td style={{ padding: '0.75rem' }}>{c.role}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {preview.length > 50 && (
                                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                    ...and {preview.length - 50} more
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={isImporting || preview.length === 0}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
                    >
                        {isImporting ? 'Importing...' : `Import ${preview.length} Connections`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImportData;
