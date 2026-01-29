import SwiftUI

struct NewConnectionView: View {
    @State private var viewModel = ConnectionFormViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ConnectionFormFields(
            name: $viewModel.name,
            email: $viewModel.email,
            company: $viewModel.company,
            role: $viewModel.role,
            location: $viewModel.location,
            linkedin: $viewModel.linkedin,
            howMet: $viewModel.howMet,
            notes: $viewModel.notes,
            goals: $viewModel.goals,
            tags: $viewModel.tags,
            frequency: $viewModel.frequency
        )
        .navigationTitle("New Connection")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }

            ToolbarItem(placement: .confirmationAction) {
                Button {
                    Task {
                        if await viewModel.save() != nil {
                            dismiss()
                        }
                    }
                } label: {
                    if viewModel.isSaving {
                        ProgressView()
                    } else {
                        Text("Save")
                    }
                }
                .disabled(!viewModel.isValid || viewModel.isSaving)
            }
        }
        .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        } message: {
            if let error = viewModel.errorMessage {
                Text(error)
            }
        }
    }
}

#Preview {
    NavigationStack {
        NewConnectionView()
    }
}
