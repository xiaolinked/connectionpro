import Foundation
import SwiftUI

@Observable
@MainActor
final class QuickAddViewModel {
    var name = ""
    var notes = ""
    var isSaving = false
    var errorMessage: String?

    var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func save() async -> ConnectionRead? {
        guard isValid else { return nil }

        isSaving = true
        errorMessage = nil

        do {
            let create = ConnectionCreate(
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                notes: notes.isEmpty ? nil : notes.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            let result = try await ConnectionService.create(create)
            isSaving = false
            return result
        } catch {
            errorMessage = error.localizedDescription
            isSaving = false
            return nil
        }
    }

    func reset() {
        name = ""
        notes = ""
        errorMessage = nil
    }
}
