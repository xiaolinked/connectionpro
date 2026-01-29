import Foundation

enum ConnectionStatusType: String {
    case healthy
    case dueSoon = "due_soon"
    case overdue
}

struct ConnectionStatusResult {
    let status: ConnectionStatusType
    let daysDiff: Int
    var overdueBy: Int = 0
    var dueIn: Int = 0
}

/// Calculates the health/status of a connection based on last contact and frequency.
/// Replicates the logic from `client/src/utils/reminders.js`.
func getConnectionStatus(_ connection: ConnectionRead) -> ConnectionStatusResult {
    guard let lastContact = connection.lastContact else {
        return ConnectionStatusResult(status: .healthy, daysDiff: 0)
    }

    let frequency = connection.frequency > 0 ? connection.frequency : 90

    let now = Date()
    let diffTime = abs(now.timeIntervalSince(lastContact))
    let diffDays = Int(ceil(diffTime / (60 * 60 * 24)))

    if diffDays > frequency {
        return ConnectionStatusResult(
            status: .overdue,
            daysDiff: diffDays,
            overdueBy: diffDays - frequency
        )
    } else if diffDays > (frequency - 14) {
        return ConnectionStatusResult(
            status: .dueSoon,
            daysDiff: diffDays,
            dueIn: frequency - diffDays
        )
    }

    return ConnectionStatusResult(status: .healthy, daysDiff: diffDays)
}

/// Returns a smart reminder message for a connection, or nil if healthy.
/// Replicates the logic from `client/src/utils/reminders.js`.
func getSmartReminderMessage(_ connection: ConnectionRead) -> String? {
    let result = getConnectionStatus(connection)

    switch result.status {
    case .overdue:
        if result.overdueBy > 30 {
            return "It's been a while. Reconnect with \(connection.name)?"
        }
        return "You wanted to catch up with \(connection.name) every \(connection.frequency) days."
    case .dueSoon:
        return "Follow-up with \(connection.name) is due in \(result.dueIn) days."
    case .healthy:
        return nil
    }
}
