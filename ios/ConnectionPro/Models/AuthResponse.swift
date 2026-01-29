import Foundation

struct RegisterResponse: Codable {
    let message: String
    let magicLink: String

    enum CodingKeys: String, CodingKey {
        case message
        case magicLink = "magic_link"
    }
}

struct VerifyResponse: Codable {
    let accessToken: String
    let tokenType: String
    let user: UserRead

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case user
    }
}

struct CheckEmailResponse: Codable {
    let exists: Bool
}
