import Foundation
import SwiftUI

enum ConnectionSortKey: String, CaseIterable {
    case name = "Name"
    case lastContact = "Last Contact"
    case company = "Company"
}

@Observable
@MainActor
final class ConnectionListViewModel {
    var connections: [ConnectionRead] = []
    var searchText = ""
    var sortKey: ConnectionSortKey = .name
    var sortAscending = true
    var isLoading = true
    var errorMessage: String?

    var filteredConnections: [ConnectionRead] {
        var result = connections

        // Filter by search text
        if !searchText.isEmpty {
            let query = searchText.lowercased()
            result = result.filter { connection in
                connection.name.lowercased().contains(query) ||
                (connection.company?.lowercased().contains(query) ?? false) ||
                connection.tags.joined(separator: " ").lowercased().contains(query)
            }
        }

        // Sort
        result.sort { a, b in
            let comparison: Bool
            switch sortKey {
            case .name:
                comparison = a.name.localizedCaseInsensitiveCompare(b.name) == .orderedAscending
            case .lastContact:
                let dateA = a.lastContact ?? Date.distantPast
                let dateB = b.lastContact ?? Date.distantPast
                comparison = dateA > dateB // More recent first by default
            case .company:
                let companyA = a.company ?? ""
                let companyB = b.company ?? ""
                comparison = companyA.localizedCaseInsensitiveCompare(companyB) == .orderedAscending
            }
            return sortAscending ? comparison : !comparison
        }

        return result
    }

    func loadConnections() async {
        isLoading = true
        errorMessage = nil

        do {
            connections = try await ConnectionService.fetchAll()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func deleteConnection(_ connection: ConnectionRead) async {
        do {
            try await ConnectionService.delete(id: connection.id)
            connections.removeAll { $0.id == connection.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func refresh() async {
        await loadConnections()
    }

    func toggleSortDirection() {
        sortAscending.toggle()
    }
}
