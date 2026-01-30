import Foundation

final class APIClient: Sendable {
    static let shared = APIClient()

    // Default to localhost; override via environment or config
    let baseURL: String

    private init() {
        // Use the CONNECTIONPRO_API_URL environment variable if set, otherwise default to production
        self.baseURL = ProcessInfo.processInfo.environment["CONNECTIONPRO_API_URL"]
            ?? "https://connectionpro-api.fly.dev"
    }

    // Custom JSON decoder that handles the backend's datetime formats
    private static let jsonDecoder: JSONDecoder = {
        let decoder = JSONDecoder()
        let formatter1 = DateFormatter()
        formatter1.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS"
        formatter1.locale = Locale(identifier: "en_US_POSIX")
        formatter1.timeZone = TimeZone(secondsFromGMT: 0)

        let formatter2 = DateFormatter()
        formatter2.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        formatter2.locale = Locale(identifier: "en_US_POSIX")
        formatter2.timeZone = TimeZone(secondsFromGMT: 0)

        let iso8601 = ISO8601DateFormatter()
        iso8601.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            if let date = formatter1.date(from: dateString) { return date }
            if let date = formatter2.date(from: dateString) { return date }
            if let date = iso8601.date(from: dateString) { return date }

            throw DecodingError.dataCorrupted(
                DecodingError.Context(
                    codingPath: decoder.codingPath,
                    debugDescription: "Cannot decode date: \(dateString)"
                )
            )
        }
        return decoder
    }()

    private static let jsonEncoder: JSONEncoder = {
        let encoder = JSONEncoder()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        encoder.dateEncodingStrategy = .formatted(formatter)
        return encoder
    }()

    /// Makes an API request and decodes the response.
    func request<T: Decodable>(
        _ endpoint: APIEndpoint,
        responseType: T.Type
    ) async throws -> T {
        let url = try buildURL(for: endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Inject auth token from Keychain if required
        if endpoint.requiresAuth, let token = KeychainService.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Encode body if present
        if let body = endpoint.body {
            request.httpBody = try Self.jsonEncoder.encode(AnyEncodable(body))
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        switch httpResponse.statusCode {
        case 200...299:
            do {
                return try Self.jsonDecoder.decode(T.self, from: data)
            } catch {
                throw APIError.decodingError(error)
            }
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        default:
            let detail: String
            if let errorBody = try? JSONDecoder().decode(ErrorDetail.self, from: data) {
                detail = errorBody.detail
            } else {
                detail = "An error occurred"
            }
            throw APIError.serverError(statusCode: httpResponse.statusCode, detail: detail)
        }
    }

    /// Makes an API request that returns no body (e.g., DELETE returning 204).
    func requestNoContent(_ endpoint: APIEndpoint) async throws {
        let url = try buildURL(for: endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if endpoint.requiresAuth, let token = KeychainService.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = endpoint.body {
            request.httpBody = try Self.jsonEncoder.encode(AnyEncodable(body))
        }

        let (_, response): (Data, URLResponse)
        do {
            (_, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        default:
            throw APIError.serverError(statusCode: httpResponse.statusCode, detail: "An error occurred")
        }
    }

    // MARK: - Private Helpers

    private func buildURL(for endpoint: APIEndpoint) throws -> URL {
        guard var components = URLComponents(string: baseURL + endpoint.path) else {
            throw APIError.networkError(URLError(.badURL))
        }
        if let queryItems = endpoint.queryItems {
            components.queryItems = queryItems
        }
        guard let url = components.url else {
            throw APIError.networkError(URLError(.badURL))
        }
        return url
    }
}

// MARK: - Helpers

/// Type-erased Encodable wrapper to allow encoding arbitrary Encodable bodies.
private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init(_ wrapped: Encodable) {
        _encode = wrapped.encode
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}

/// For decoding error responses from the API.
private struct ErrorDetail: Decodable {
    let detail: String
}
