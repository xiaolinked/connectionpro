import Foundation

struct LogRead: Codable, Identifiable, Equatable {
    let id: String
    var connectionId: String?
    var type: String
    var notes: String
    var tags: [String]
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case connectionId = "connection_id"
        case type, notes, tags
        case createdAt = "created_at"
    }
}

struct LogCreate: Codable {
    var connectionId: String?
    var type: String = "interaction"
    var notes: String
    var tags: [String] = []

    enum CodingKeys: String, CodingKey {
        case connectionId = "connection_id"
        case type, notes, tags
    }
}
