import Foundation

enum AuthService {
    private static let client = APIClient.shared

    static func checkEmail(_ email: String) async throws -> CheckEmailResponse {
        try await client.request(.checkEmail(email: email), responseType: CheckEmailResponse.self)
    }

    static func register(name: String, email: String) async throws -> RegisterResponse {
        try await client.request(.register(name: name, email: email), responseType: RegisterResponse.self)
    }

    static func verify(token: String) async throws -> VerifyResponse {
        try await client.request(.verify(token: token), responseType: VerifyResponse.self)
    }

    static func getMe() async throws -> UserRead {
        try await client.request(.getMe(), responseType: UserRead.self)
    }

    static func updateMe(_ updates: UserUpdate) async throws -> UserRead {
        try await client.request(.updateMe(updates: updates), responseType: UserRead.self)
    }
}
