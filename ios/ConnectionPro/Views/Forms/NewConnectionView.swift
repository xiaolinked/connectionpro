import SwiftUI

struct NewConnectionView: View {
    @State private var viewModel = ConnectionFormViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var showingContactPicker = false

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
        .navigationTitle("New Connection")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }
            
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingContactPicker = true
                } label: {
                    Image(systemName: "person.crop.circle.badge.plus")
                }
            }

            ToolbarItem(placement: .confirmationAction) {
                Button {
                    Task {
                        if await viewModel.save() != nil {
                            ToastManager.shared.show("Connection saved!", type: .success)
                            dismiss()
                        } else if viewModel.errorMessage != nil {
                            ToastManager.shared.show(viewModel.errorMessage ?? "Failed to save", type: .error)
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
        .sheet(isPresented: $showingContactPicker) {
            ContactPickerView { contact in
                // Pre-fill form with selected contact
                viewModel.name = contact.name
                viewModel.email = contact.email ?? ""
                viewModel.company = contact.company ?? ""
                viewModel.role = contact.jobTitle ?? ""
            }
        }
        .toastOverlay()
    }
}

#Preview {
    NavigationStack {
        NewConnectionView()
    }
}
