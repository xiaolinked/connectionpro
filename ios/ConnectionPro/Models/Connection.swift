import Foundation

struct ConnectionRead: Codable, Identifiable, Equatable, Hashable {
    let id: String
    var name: String
    var role: String?
    var company: String?
    var location: String?
    var industry: String?
    var howMet: String?
    var frequency: Int
    var lastContact: Date?
    var notes: String?
    var linkedin: String?
    var email: String?
    var goals: String?
    var tags: [String]
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, role, company, location, industry, howMet
        case frequency, lastContact, notes, linkedin, email, goals, tags
        case createdAt = "created_at"
    }
}

struct ConnectionCreate: Codable {
    var name: String
    var role: String?
    var company: String?
    var location: String?
    var industry: String?
    var howMet: String?
    var frequency: Int = 90
    var lastContact: Date?
    var notes: String?
    var linkedin: String?
    var email: String?
    var goals: String?
    var tags: [String] = []
}

struct ConnectionUpdate: Codable {
    var name: String?
    var role: String?
    var company: String?
    var location: String?
    var industry: String?
    var howMet: String?
    var frequency: Int?
    var lastContact: Date?
    var notes: String?
    var linkedin: String?
    var email: String?
    var goals: String?
    var tags: [String]?
}
