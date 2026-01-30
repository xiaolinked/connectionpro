import Foundation

struct TagDefinition: Codable, Identifiable, Equatable, Hashable {
    let id: String
    let category: String
    let name: String
    let type: String // "connection" or "interaction"
    let isCustom: Bool

    enum CodingKeys: String, CodingKey {
        case id, category, name, type
        case isCustom = "is_custom"
    }
}
