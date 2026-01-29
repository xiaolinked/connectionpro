import Foundation
import SwiftUI

@Observable
@MainActor
final class ConnectionFormViewModel {
    // Form fields
    var name = ""
    var email = ""
    var company = ""
    var role = ""
    var location = ""
    var linkedin = ""
    var howMet = ""
    var notes = ""
    var goals = ""
    var tags: [String] = []
    var frequency = 0

    var isSaving = false
    var errorMessage: String?

    let isEditMode: Bool
    private let existingConnection: ConnectionRead?

    init(connection: ConnectionRead? = nil) {
        self.isEditMode = connection != nil
        self.existingConnection = connection

        if let c = connection {
            name = c.name
            email = c.email ?? ""
            company = c.company ?? ""
            role = c.role ?? ""
            location = c.location ?? ""
            linkedin = c.linkedin ?? ""
            howMet = c.howMet ?? ""
            notes = c.notes ?? ""
            goals = c.goals ?? ""
            tags = c.tags
            frequency = c.frequency
        }
    }

    var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func save() async -> ConnectionRead? {
        guard isValid else { return nil }

        isSaving = true
        errorMessage = nil

        do {
            let result: ConnectionRead

            if isEditMode, let existing = existingConnection {
                // Update
                let update = ConnectionUpdate(
                    name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                    role: role.isEmpty ? nil : role,
                    company: company.isEmpty ? nil : company,
                    location: location.isEmpty ? nil : location,
                    howMet: howMet.isEmpty ? nil : howMet,
                    frequency: frequency,
                    notes: notes.isEmpty ? nil : notes,
                    linkedin: linkedin.isEmpty ? nil : linkedin,
                    email: email.isEmpty ? nil : email,
                    goals: goals.isEmpty ? nil : goals,
                    tags: tags.isEmpty ? nil : tags
                )
                result = try await ConnectionService.update(id: existing.id, data: update)
            } else {
                // Create
                let create = ConnectionCreate(
                    name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                    role: role.isEmpty ? nil : role,
                    company: company.isEmpty ? nil : company,
                    location: location.isEmpty ? nil : location,
                    howMet: howMet.isEmpty ? nil : howMet,
                    frequency: frequency,
                    notes: notes.isEmpty ? nil : notes,
                    linkedin: linkedin.isEmpty ? nil : linkedin,
                    email: email.isEmpty ? nil : email,
                    goals: goals.isEmpty ? nil : goals,
                    tags: tags
                )
                result = try await ConnectionService.create(create)
            }

            isSaving = false
            return result
        } catch {
            errorMessage = error.localizedDescription
            isSaving = false
            return nil
        }
    }
}
