import Foundation

struct TagService {
    private static let client = APIClient.shared

    static func getTags(type: String) async throws -> [TagDefinition] {
        try await client.request(.getTags(type: type), responseType: [TagDefinition].self)
    }
}
