import Foundation
import SwiftUI

enum RegisterStep {
    case email
    case name
    case checkEmail
}

@Observable
@MainActor
final class AuthViewModel {
    var user: UserRead?
    var isAuthenticated = false
    var isLoading = true
    var errorMessage: String?

    // Register flow state
    var registerStep: RegisterStep = .email
    var registerEmail = ""
    var registerName = ""
    var magicLink: String?
    var isRegistering = false

    // Verify state
    var isVerifying = false
    var verifyError: String?

    init() {
        Task {
            await checkExistingSession()
        }
    }

    /// On launch, check if we have a saved token and try to restore the session.
    func checkExistingSession() async {
        guard KeychainService.shared.getToken() != nil else {
            isLoading = false
            return
        }

        do {
            let me = try await AuthService.getMe()
            user = me
            isAuthenticated = true
        } catch {
            // Token is expired or invalid — clear it
            KeychainService.shared.deleteToken()
        }
        isLoading = false
    }

    // MARK: - Register Flow

    func checkEmail() async {
        let email = registerEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !email.isEmpty else { return }
        registerEmail = email

        do {
            let result = try await AuthService.checkEmail(email)
            if result.exists {
                // Existing user — skip name step, go straight to magic link
                registerStep = .checkEmail
                await sendMagicLink(name: "")
            } else {
                registerStep = .name
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func register() async {
        isRegistering = true
        errorMessage = nil
        await sendMagicLink(name: registerName)
        isRegistering = false
    }

    private func sendMagicLink(name: String) async {
        do {
            let response = try await AuthService.register(name: name, email: registerEmail)
            magicLink = response.magicLink
            registerStep = .checkEmail
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Deep Link Verification

    func handleDeepLink(url: URL) async {
        // Expected format: connectionpro://verify?token=XYZ
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              components.host == "verify",
              let token = components.queryItems?.first(where: { $0.name == "token" })?.value
        else {
            return
        }
        await verifyToken(token)
    }

    func verifyToken(_ token: String) async {
        isVerifying = true
        verifyError = nil

        do {
            let response = try await AuthService.verify(token: token)
            KeychainService.shared.saveToken(response.accessToken)
            user = response.user
            isAuthenticated = true
        } catch {
            verifyError = error.localizedDescription
        }
        isVerifying = false
    }

    /// For demo purposes: extract token from magic link URL and verify directly.
    func verifyFromMagicLink() async {
        guard let magicLink = magicLink,
              let url = URL(string: magicLink),
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let token = components.queryItems?.first(where: { $0.name == "token" })?.value
        else {
            verifyError = "Invalid magic link"
            return
        }
        await verifyToken(token)
    }

    // MARK: - Logout

    func logout() {
        KeychainService.shared.deleteToken()
        user = nil
        isAuthenticated = false
        registerStep = .email
        registerEmail = ""
        registerName = ""
        magicLink = nil
    }

    // MARK: - Update User

    func updateUser(_ updates: UserUpdate) async throws -> UserRead {
        let updatedUser = try await AuthService.updateMe(updates)
        user = updatedUser
        return updatedUser
    }

    func resetRegisterFlow() {
        registerStep = .email
        registerEmail = ""
        registerName = ""
        magicLink = nil
        errorMessage = nil
    }
}
