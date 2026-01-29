import Foundation

enum ConnectionService {
    private static let client = APIClient.shared

    static func fetchAll() async throws -> [ConnectionRead] {
        try await client.request(.getConnections(), responseType: [ConnectionRead].self)
    }

    static func fetch(id: String) async throws -> ConnectionRead {
        try await client.request(.getConnection(id: id), responseType: ConnectionRead.self)
    }

    static func create(_ data: ConnectionCreate) async throws -> ConnectionRead {
        try await client.request(.createConnection(data: data), responseType: ConnectionRead.self)
    }

    static func update(id: String, data: ConnectionUpdate) async throws -> ConnectionRead {
        try await client.request(.updateConnection(id: id, data: data), responseType: ConnectionRead.self)
    }

    static func delete(id: String) async throws {
        try await client.requestNoContent(.deleteConnection(id: id))
    }
}
