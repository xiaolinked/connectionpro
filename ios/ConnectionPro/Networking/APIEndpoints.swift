import Foundation

struct APIEndpoint {
    let path: String
    let method: String
    var queryItems: [URLQueryItem]?
    var body: Encodable?

    var requiresAuth: Bool = true

    // MARK: - Auth Endpoints

    static func checkEmail(email: String) -> APIEndpoint {
        APIEndpoint(
            path: "/auth/check-email",
            method: "GET",
            queryItems: [URLQueryItem(name: "email", value: email)],
            requiresAuth: false
        )
    }

    static func register(name: String, email: String) -> APIEndpoint {
        APIEndpoint(
            path: "/auth/register",
            method: "POST",
            body: UserCreate(email: email, name: name),
            requiresAuth: false
        )
    }

    static func verify(token: String) -> APIEndpoint {
        APIEndpoint(
            path: "/auth/verify",
            method: "POST",
            queryItems: [URLQueryItem(name: "token", value: token)],
            requiresAuth: false
        )
    }

    static func getMe() -> APIEndpoint {
        APIEndpoint(path: "/auth/me", method: "GET")
    }

    static func updateMe(updates: UserUpdate) -> APIEndpoint {
        APIEndpoint(path: "/auth/me", method: "PUT", body: updates)
    }

    // MARK: - Connection Endpoints

    static func getConnections() -> APIEndpoint {
        APIEndpoint(path: "/connections", method: "GET")
    }

    static func getConnection(id: String) -> APIEndpoint {
        APIEndpoint(path: "/connections/\(id)", method: "GET")
    }

    static func createConnection(data: ConnectionCreate) -> APIEndpoint {
        APIEndpoint(path: "/connections", method: "POST", body: data)
    }

    static func updateConnection(id: String, data: ConnectionUpdate) -> APIEndpoint {
        APIEndpoint(path: "/connections/\(id)", method: "PUT", body: data)
    }

    static func deleteConnection(id: String) -> APIEndpoint {
        APIEndpoint(path: "/connections/\(id)", method: "DELETE")
    }

    // MARK: - Log Endpoints

    static func getLogs() -> APIEndpoint {
        APIEndpoint(path: "/logs", method: "GET")
    }

    static func createLog(data: LogCreate) -> APIEndpoint {
        APIEndpoint(path: "/logs", method: "POST", body: data)
    }

    static func deleteLog(id: String) -> APIEndpoint {
        APIEndpoint(path: "/logs/\(id)", method: "DELETE")
    }
}
