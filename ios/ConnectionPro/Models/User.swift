import Foundation

struct UserRead: Codable, Identifiable, Equatable {
    let id: String
    let email: String
    let name: String
    let isActive: Bool
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, name
        case isActive = "is_active"
        case createdAt = "created_at"
    }
}

struct UserCreate: Codable {
    let email: String
    let name: String
}

struct UserUpdate: Codable {
    var name: String?
}
