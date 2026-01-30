import SwiftUI

struct EditConnectionView: View {
    let connection: ConnectionRead
    @State private var viewModel: ConnectionFormViewModel
    @Environment(\.dismiss) private var dismiss

    init(connection: ConnectionRead) {
        self.connection = connection
        _viewModel = State(initialValue: ConnectionFormViewModel(connection: connection))
    }

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
            frequency: $viewModel.frequency,
            availableTags: viewModel.availableTags
        )
        .task {
            await viewModel.loadTags()
        }
        .navigationTitle("Edit Connection")
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
        EditConnectionView(connection: PreviewData.connection)
    }
}
