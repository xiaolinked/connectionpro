/**
 * Calculates the 'Health' or status of a connection.
 * @param {Object} connection - The connection object
 * @returns {Object} { status: 'overdue' | 'due_soon' | 'healthy', daysDiff: number }
 */
export const getConnectionStatus = (connection) => {
    if (!connection.lastContact) return { status: 'healthy', daysDiff: 0 }; // New connections are healthy? Or unknown.

    // Default frequency if not set (e.g. 90 days)
    const frequency = parseInt(connection.frequency) || 90;

    const last = new Date(connection.lastContact);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Logic: 
    // If days since last contact > frequency, it's overdue.
    // If days since last contact is within 7 days of frequency, 'due soon'.

    if (diffDays > frequency) {
        return { status: 'overdue', daysDiff: diffDays, overdueBy: diffDays - frequency };
    } else if (diffDays > (frequency - 14)) {
        return { status: 'due_soon', daysDiff: diffDays, dueIn: frequency - diffDays };
    }

    return { status: 'healthy', daysDiff: diffDays };
};

export const getSmartReminderMessage = (connection) => {
    const { status, overdueBy, dueIn } = getConnectionStatus(connection);

    if (status === 'overdue') {
        if (overdueBy > 30) return `It's been a while. Reconnect with ${connection.name}?`;
        return `You wanted to catch up with ${connection.name} every ${connection.frequency} days.`;
    }
    if (status === 'due_soon') {
        return `Follow-up with ${connection.name} is due in ${dueIn} days.`;
    }
    return null;
};
