import SwiftUI

struct MultiCategoryTagPicker: View {
    @Binding var selectedTags: [String]
    let availableTags: [String: [TagDefinition]]
    @State private var customTag = ""

    // Ordered categories for display
    private let categoryOrder = ["connectionStrength", "goals", "other"]
    
    // Map category keys to display titles
    private let categoryTitles: [String: String] = [
        "connectionStrength": "Connection Strength",
        "goals": "Goals & Interests",
        "other": "Other"
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Display categories in order
            ForEach(categoryOrder, id: \.self) { categoryKey in
                if let tags = availableTags[categoryKey], !tags.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(categoryTitles[categoryKey] ?? categoryKey.capitalized)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        
                        FlowLayout(spacing: 8) {
                            ForEach(tags) { tagDef in
                                TagChip(
                                    text: tagDef.name,
                                    isSelected: selectedTags.contains(tagDef.name)
                                ) {
                                    toggleTag(tagDef.name)
                                }
                            }
                        }
                    }
                }
            }
            
            // Custom Tags Section
            VStack(alignment: .leading, spacing: 8) {
                Text("Custom Tags")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                
                // Display selected custom tags (that aren't in availableTags)
                let customSelected = selectedTags.filter { tag in
                    !availableTags.values.flatMap { $0 }.contains { $0.name == tag }
                }
                
                if !customSelected.isEmpty {
                    FlowLayout(spacing: 8) {
                        ForEach(customSelected, id: \.self) { tag in
                            TagChip(
                                text: tag,
                                isSelected: true,
                                isCustom: true
                            ) {
                                toggleTag(tag)
                            }
                        }
                    }
                }

                // Custom tag input
                HStack {
                    TextField("Add custom tag", text: $customTag)
                        .textFieldStyle(.roundedBorder)
                        .autocapitalization(.none)

                    Button {
                        addCustomTag()
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundStyle(Color.appPrimary)
                    }
                    .disabled(customTag.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func toggleTag(_ tag: String) {
        if let index = selectedTags.firstIndex(of: tag) {
            selectedTags.remove(at: index)
        } else {
            selectedTags.append(tag)
        }
    }

    private func addCustomTag() {
        let trimmed = customTag.trimmingCharacters(in: .whitespaces) // Case sensitive? Standardize on backend usually, but for UI keep as Typed?
        guard !trimmed.isEmpty, !selectedTags.contains(trimmed) else { return }
        selectedTags.append(trimmed)
        customTag = ""
    }
}

#Preview {
    MultiCategoryTagPicker(
        selectedTags: .constant(["Familiar"]),
        availableTags: [
            "connectionStrength": [
                TagDefinition(id: "1", category: "connectionStrength", name: "Familiar", type: "connection", isCustom: false),
                TagDefinition(id: "2", category: "connectionStrength", name: "Close", type: "connection", isCustom: false)
            ]
        ]
    )
}
