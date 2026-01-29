import Foundation
import SwiftUI

@Observable
@MainActor
final class DashboardViewModel {
    var connections: [ConnectionRead] = []
    var logs: [LogRead] = []
    var isLoading = true
    var errorMessage: String?

    // MARK: - Computed Stats

    var totalConnections: Int {
        connections.count
    }

    var upcomingFollowUps: Int {
        connections.filter { connection in
            let status = getConnectionStatus(connection)
            return status.status == .overdue || status.status == .dueSoon
        }.count
    }

    var growthMoments: Int {
        logs.filter { $0.tags.contains("learning") }.count
    }

    /// Smart reminders: overdue first (most overdue), then due_soon (soonest due), max 3
    var smartReminders: [(connection: ConnectionRead, message: String)] {
        connections
            .compactMap { connection -> (connection: ConnectionRead, status: ConnectionStatusResult, message: String)? in
                let status = getConnectionStatus(connection)
                guard status.status == .overdue || status.status == .dueSoon,
                      let message = getSmartReminderMessage(connection) else {
                    return nil
                }
                return (connection, status, message)
            }
            .sorted { a, b in
                // Overdue before due_soon
                if a.status.status != b.status.status {
                    return a.status.status == .overdue
                }
                // Within overdue: most overdue first
                if a.status.status == .overdue {
                    return a.status.overdueBy > b.status.overdueBy
                }
                // Within due_soon: soonest due first
                return a.status.dueIn < b.status.dueIn
            }
            .prefix(3)
            .map { ($0.connection, $0.message) }
    }

    /// Recent logs, sorted by created_at descending, first 5
    var recentLogs: [LogRead] {
        Array(
            logs.sorted { $0.createdAt > $1.createdAt }
                .prefix(5)
        )
    }

    // MARK: - Data Loading

    func loadData() async {
        isLoading = true
        errorMessage = nil

        do {
            async let fetchedConnections = ConnectionService.fetchAll()
            async let fetchedLogs = LogService.fetchAll()

            connections = try await fetchedConnections
            logs = try await fetchedLogs
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func refresh() async {
        await loadData()
    }
}
