import React from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, to }) => {
    const content = (
        <>
            <div>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '500', marginBottom: '0.25rem' }}>{title}</h3>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{value}</p>
            </div>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color || 'var(--color-accent-primary)'
            }}>
                {Icon && <Icon size={24} />}
            </div>
        </>
    );

    if (to) {
        return (
            <Link
                to={to}
                className="card"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                }}
            >
                {content}
            </Link>
        );
    }

    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {content}
        </div>
    );
};

export default StatCard;
