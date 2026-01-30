import Foundation
import SwiftUI

@Observable
@MainActor
final class SettingsViewModel {
    var name: String
    let email: String
    var isSaving = false
    var saveMessage: String?
    var saveSuccess = false

    private let originalName: String
    private let authViewModel: AuthViewModel

    var hasChanges: Bool {
        name != originalName
    }

    init(authViewModel: AuthViewModel) {
        self.authViewModel = authViewModel
        self.name = authViewModel.user?.name ?? ""
        self.email = authViewModel.user?.email ?? ""
        self.originalName = authViewModel.user?.name ?? ""
    }

    func save() async {
        guard hasChanges else { return }

        isSaving = true
        saveMessage = nil
        saveSuccess = false

        do {
            let update = UserUpdate(name: name.trimmingCharacters(in: .whitespacesAndNewlines))
            _ = try await authViewModel.updateUser(update)
            saveMessage = "Profile updated successfully."
            saveSuccess = true
        } catch {
            saveMessage = "Failed to update profile."
            saveSuccess = false
        }

        isSaving = false
    }

    func logout() {
        authViewModel.logout()
    }

    // MARK: - Delete Account

    func deleteAccount() async {
        isSaving = true
        saveMessage = nil
        do {
            try await authViewModel.deleteAccount()
            // Logout happens automatically in authViewModel
        } catch {
            saveMessage = "Error deleting account: \(error.localizedDescription)"
            saveSuccess = false
            isSaving = false
        }
    }
}
