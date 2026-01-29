import Foundation
import SwiftUI

@Observable
@MainActor
final class ConnectionDetailViewModel {
    var connection: ConnectionRead?
    var logs: [LogRead] = []
    var isLoading = true
    var errorMessage: String?
    var isDeleting = false

    // Inline log form state
    var logType = "call"
    var logNotes = ""
    var logTags = ""
    var isAddingLog = false

    let connectionId: String

    init(connectionId: String) {
        self.connectionId = connectionId
    }

    var connectionLogs: [LogRead] {
        logs.filter { $0.connectionId == connectionId }
            .sorted { $0.createdAt > $1.createdAt }
    }

    func loadData() async {
        isLoading = true
        errorMessage = nil

        do {
            async let fetchedConnection = ConnectionService.fetch(id: connectionId)
            async let fetchedLogs = LogService.fetchAll()

            connection = try await fetchedConnection
            logs = try await fetchedLogs
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func addLog() async {
        guard let connection = connection else { return }
        guard !logNotes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        isAddingLog = true

        let tags = logTags.split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        let newLog = LogCreate(
            connectionId: connection.id,
            type: logType,
            notes: logNotes.trimmingCharacters(in: .whitespacesAndNewlines),
            tags: tags
        )

        do {
            let created = try await LogService.create(newLog)
            logs.insert(created, at: 0)

            // Update last contact on connection
            let update = ConnectionUpdate(lastContact: Date())
            self.connection = try await ConnectionService.update(id: connection.id, data: update)

            // Reset form
            logType = "call"
            logNotes = ""
            logTags = ""
        } catch {
            errorMessage = error.localizedDescription
        }

        isAddingLog = false
    }

    func deleteConnection() async -> Bool {
        isDeleting = true
        do {
            try await ConnectionService.delete(id: connectionId)
            isDeleting = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isDeleting = false
            return false
        }
    }
}
