import Foundation

enum APIError: LocalizedError {
    case unauthorized
    case notFound
    case serverError(statusCode: Int, detail: String)
    case decodingError(Error)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Unauthorized"
        case .notFound:
            return "Not found"
        case .serverError(_, let detail):
            return detail
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .networkError(let error):
            return error.localizedDescription
        }
    }
}
