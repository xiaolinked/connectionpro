import SwiftUI

struct SettingsView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var viewModel: SettingsViewModel?

    var body: some View {
        Group {
            if let viewModel = viewModel {
                settingsContent(viewModel: viewModel)
            } else {
                LoadingView()
            }
        }
        .navigationTitle("Settings")
        .onAppear {
            if viewModel == nil {
                viewModel = SettingsViewModel(authViewModel: authViewModel)
            }
        }
    }

    @ViewBuilder
    private func settingsContent(viewModel: SettingsViewModel) -> some View {
        @Bindable var vm = viewModel

        Form {
            // Profile Section
            Section {
                HStack(spacing: 16) {
                    AvatarView(name: viewModel.name, size: 60)

                    VStack(alignment: .leading, spacing: 4) {
                        TextField("Name", text: $vm.name)
                            .font(.headline)

                        Text(viewModel.email)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 8)
            } header: {
                Label("Profile", systemImage: "person.circle")
            }

            // Save Button
            if viewModel.hasChanges {
                Section {
                    Button {
                        Task { await viewModel.save() }
                    } label: {
                        HStack {
                            if viewModel.isSaving {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Save Changes")
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .disabled(viewModel.isSaving)
                }
            }

            // Status Message
            if let message = viewModel.saveMessage {
                Section {
                    HStack {
                        Image(systemName: viewModel.saveSuccess ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundStyle(viewModel.saveSuccess ? .green : .red)
                        Text(message)
                            .foregroundStyle(viewModel.saveSuccess ? .green : .red)
                    }
                }
            }

            // Account Security Section
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("You are logged in via a secure magic link. No password is required.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    HStack {
                        Image(systemName: "shield.checkered")
                            .foregroundStyle(.blue)
                        Text("Active session valid for 7 days")
                            .font(.caption)
                            .foregroundStyle(.blue)
                    }
                    .padding(10)
                    .background(Color.blue.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .padding(.vertical, 4)
            } header: {
                Label("Account Security", systemImage: "shield")
            }

            // Logout Section
            Section {
                Button(role: .destructive) {
                    viewModel.logout()
                } label: {
                    HStack {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                        Text("Logout")
                    }
                }
            } header: {
                Label("Account Actions", systemImage: "gear")
            } footer: {
                Text("This will sign you out and clear your session from this device.")
            }
        }
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
    .environment(AuthViewModel())
}
