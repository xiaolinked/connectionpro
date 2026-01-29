import Foundation

enum LogService {
    private static let client = APIClient.shared

    static func fetchAll() async throws -> [LogRead] {
        try await client.request(.getLogs(), responseType: [LogRead].self)
    }

    static func create(_ data: LogCreate) async throws -> LogRead {
        try await client.request(.createLog(data: data), responseType: LogRead.self)
    }

    static func delete(id: String) async throws {
        try await client.requestNoContent(.deleteLog(id: id))
    }
}
