import SwiftUI

struct TagPickerView: View {
    @Binding var selectedTags: [String]
    @State private var customTag = ""

    private let presetTags = [
        "mentor", "colleague", "friend", "investor",
        "client", "learning", "industry", "referral"
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Tags")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            // Preset tags
            FlowLayout(spacing: 8) {
                ForEach(presetTags, id: \.self) { tag in
                    TagChip(
                        text: tag,
                        isSelected: selectedTags.contains(tag)
                    ) {
                        toggleTag(tag)
                    }
                }

                // Display custom tags
                ForEach(selectedTags.filter { !presetTags.contains($0) }, id: \.self) { tag in
                    TagChip(
                        text: tag,
                        isSelected: true,
                        isCustom: true
                    ) {
                        toggleTag(tag)
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

    private func toggleTag(_ tag: String) {
        if let index = selectedTags.firstIndex(of: tag) {
            selectedTags.remove(at: index)
        } else {
            selectedTags.append(tag)
        }
    }

    private func addCustomTag() {
        let trimmed = customTag.trimmingCharacters(in: .whitespaces).lowercased()
        guard !trimmed.isEmpty, !selectedTags.contains(trimmed) else { return }
        selectedTags.append(trimmed)
        customTag = ""
    }
}

struct TagChip: View {
    let text: String
    let isSelected: Bool
    var isCustom: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(text)
                if isSelected && isCustom {
                    Image(systemName: "xmark")
                        .font(.caption2)
                }
            }
            .font(.caption)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isSelected ? Color.appPrimary : Color.appPrimary.opacity(0.1))
            .foregroundStyle(isSelected ? .white : .appPrimary)
            .clipShape(Capsule())
        }
    }
}

#Preview {
    TagPickerView(selectedTags: .constant(["mentor", "learning"]))
        .padding()
}
