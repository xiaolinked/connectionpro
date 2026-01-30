import SwiftUI

struct ConnectionFormFields: View {
    @Binding var name: String
    @Binding var email: String
    @Binding var company: String
    @Binding var role: String
    @Binding var location: String
    @Binding var linkedin: String
    @Binding var howMet: String
    @Binding var notes: String
    @Binding var goals: String
    @Binding var tags: [String]
    @Binding var frequency: Int
    
    // Available tags for the picker
    var availableTags: [String: [TagDefinition]] = [:]

    var body: some View {
        Form {
            // Identity Section
            Section("Identity") {
                TextField("Name *", text: $name)
                    .textContentType(.name)

                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
            }

            // Professional Details
            Section("Professional Details") {
                TextField("Company", text: $company)
                TextField("Role / Title", text: $role)
                TextField("Location", text: $location)
                    .textContentType(.addressCity)
                TextField("LinkedIn URL", text: $linkedin)
                    .keyboardType(.URL)
                    .autocapitalization(.none)
            }

            // How Met
            Section("Connection Origin") {
                TextField("How did you meet?", text: $howMet, axis: .vertical)
                    .lineLimit(2...4)
            }

            // Notes & Goals
            Section("Notes & Goals") {
                TextField("Notes", text: $notes, axis: .vertical)
                    .lineLimit(3...6)

                TextField("Goals for this relationship", text: $goals, axis: .vertical)
                    .lineLimit(2...4)
            }

            // Tags
            Section {
                MultiCategoryTagPicker(selectedTags: $tags, availableTags: availableTags)
            }

            // Cadence
            Section {
                CadencePickerView(frequency: $frequency)
            }
        }
    }
}

#Preview {
    ConnectionFormFields(
        name: .constant("John Doe"),
        email: .constant("john@example.com"),
        company: .constant("Acme Inc"),
        role: .constant("CEO"),
        location: .constant("San Francisco"),
        linkedin: .constant(""),
        howMet: .constant("Met at a conference"),
        notes: .constant("Great person to know"),
        goals: .constant("Learn from their experience"),
        tags: .constant(["mentor", "industry"]),
        frequency: .constant(30)
    )
}
