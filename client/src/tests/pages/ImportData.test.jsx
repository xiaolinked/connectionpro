import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportData from '../../pages/ImportData';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock PapaParse
vi.mock('papaparse', () => ({
    default: {
        parse: vi.fn(),
    },
}));

// Mock DataContext
const mockBulkAddConnections = vi.fn();
vi.mock('../../context/DataContext', () => ({
    useData: () => ({
        bulkAddConnections: mockBulkAddConnections,
    }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

import Papa from 'papaparse';

function renderImportData() {
    return render(
        <MemoryRouter>
            <ImportData />
        </MemoryRouter>
    );
}

describe('ImportData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders upload interface', () => {
        renderImportData();
        expect(screen.getByText('Import Connections')).toBeInTheDocument();
        expect(screen.getByText('Click to Upload CSV')).toBeInTheDocument();
    });

    it('renders LinkedIn instructions', () => {
        renderImportData();
        expect(screen.getByText(/LinkedIn Settings/)).toBeInTheDocument();
    });

    it('rejects non-CSV files', () => {
        renderImportData();
        const input = document.querySelector('input[type="file"]');
        const file = new File(['data'], 'test.txt', { type: 'text/plain' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('Please upload a valid CSV file.')).toBeInTheDocument();
    });

    it('parses CSV file and shows preview', async () => {
        Papa.parse.mockImplementation((file, options) => {
            options.complete({
                data: [
                    { 'First Name': 'Alice', 'Last Name': 'Smith', 'Company': 'Acme', 'Position': 'Engineer', 'Email Address': 'alice@acme.com' },
                    { 'First Name': 'Bob', 'Last Name': 'Jones', 'Company': 'Corp', 'Position': 'Designer', 'Email Address': '' },
                ],
            });
        });

        renderImportData();
        const input = document.querySelector('input[type="file"]');
        const file = new File(['csv data'], 'Connections.csv', { type: 'text/csv' });

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Jones')).toBeInTheDocument();
        });
        expect(screen.getByText('2 connections found')).toBeInTheDocument();
    });

    it('shows file name after upload', () => {
        Papa.parse.mockImplementation((file, options) => {
            options.complete({
                data: [{ 'First Name': 'Test', 'Last Name': 'User', 'Company': '', 'Position': '' }],
            });
        });

        renderImportData();
        const input = document.querySelector('input[type="file"]');
        const file = new File(['csv'], 'MyConnections.csv', { type: 'text/csv' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('MyConnections.csv')).toBeInTheDocument();
    });

    it('filters empty rows from parsed data', () => {
        Papa.parse.mockImplementation((file, options) => {
            options.complete({
                data: [
                    { 'First Name': 'Alice', 'Last Name': 'Smith', 'Company': 'Corp', 'Position': 'Dev' },
                    { 'First Name': '', 'Last Name': '', 'Company': '', 'Position': '' },
                ],
            });
        });

        renderImportData();
        const input = document.querySelector('input[type="file"]');
        const file = new File(['csv'], 'test.csv', { type: 'text/csv' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('1 connections found')).toBeInTheDocument();
    });

    it('shows 0 connections for empty CSV data', () => {
        Papa.parse.mockImplementation((file, options) => {
            options.complete({ data: [] });
        });

        renderImportData();
        const input = document.querySelector('input[type="file"]');
        const file = new File([''], 'empty.csv', { type: 'text/csv' });

        fireEvent.change(input, { target: { files: [file] } });

        // File is set so preview view shows; error is set but shown in upload zone only
        // The file preview shows with 0 connections
        expect(screen.getByText('empty.csv')).toBeInTheDocument();
        expect(screen.getByText('0 connections found')).toBeInTheDocument();
    });

    it('shows remove button and allows reset', async () => {
        Papa.parse.mockImplementation((file, options) => {
            options.complete({
                data: [{ 'First Name': 'A', 'Last Name': 'B', 'Company': 'C', 'Position': 'D' }],
            });
        });

        renderImportData();
        const input = document.querySelector('input[type="file"]');
        const file = new File(['csv'], 'test.csv', { type: 'text/csv' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('Remove')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Remove'));

        // Should go back to upload state
        expect(screen.getByText('Click to Upload CSV')).toBeInTheDocument();
    });

    it('renders import button with count', () => {
        Papa.parse.mockImplementation((file, options) => {
            options.complete({
                data: [
                    { 'First Name': 'A', 'Last Name': 'B', 'Company': 'C', 'Position': 'D' },
                    { 'First Name': 'E', 'Last Name': 'F', 'Company': 'G', 'Position': 'H' },
                ],
            });
        });

        renderImportData();
        const input = document.querySelector('input[type="file"]');
        const file = new File(['csv'], 'test.csv', { type: 'text/csv' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('Import 2 Connections')).toBeInTheDocument();
    });
});
