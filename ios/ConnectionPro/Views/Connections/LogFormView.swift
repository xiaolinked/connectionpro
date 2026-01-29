import SwiftUI

struct LogFormView: View {
    @Binding var logType: String
    @Binding var logNotes: String
    @Binding var logTags: String
    let isLoading: Bool
    let onSubmit: () -> Void

    private let logTypes = ["call", "email", "meeting", "social"]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Log Interaction")
                .font(.headline)

            // Type picker
            Picker("Type", selection: $logType) {
                ForEach(logTypes, id: \.self) { type in
                    Text(type.capitalized).tag(type)
                }
            }
            .pickerStyle(.segmented)

            // Notes
            TextField("What did you discuss?", text: $logNotes, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(2...4)

            // Tags
            TextField("Tags (comma separated)", text: $logTags)
                .textFieldStyle(.roundedBorder)
                .font(.subheadline)

            // Submit button
            Button {
                onSubmit()
            } label: {
                HStack {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: "plus.circle.fill")
                        Text("Add Interaction")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .tint(.appPrimary)
            .disabled(logNotes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isLoading)
        }
        .padding()
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    LogFormView(
        logType: .constant("call"),
        logNotes: .constant(""),
        logTags: .constant(""),
        isLoading: false
    ) {
        print("Submit")
    }
    .padding()
    .background(Color.sectionBackground)
}
