import SwiftUI

struct RegisterView: View {
    @Environment(AuthViewModel.self) private var authViewModel

    var body: some View {
        @Bindable var auth = authViewModel

        VStack(spacing: 0) {
            Spacer()

            // App branding
            VStack(spacing: 12) {
                Image(systemName: "person.2.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.appPrimary, .appSecondary],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                Text("ConnectionPro")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("Stay connected with the people who matter")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.bottom, 48)

            // Step content
            VStack(spacing: 20) {
                switch authViewModel.registerStep {
                case .email:
                    emailStep(auth: auth)
                case .name:
                    nameStep(auth: auth)
                case .checkEmail:
                    checkEmailStep
                }
            }
            .padding(.horizontal, 32)

            if let error = authViewModel.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.top, 12)
            }

            Spacer()
            Spacer()
        }
        .background(Color.sectionBackground)
    }

    // MARK: - Step 1: Email

    @ViewBuilder
    private func emailStep(auth: AuthViewModel) -> some View {
        VStack(spacing: 16) {
            TextField("Email address", text: Bindable(auth).registerEmail)
                .textFieldStyle(.roundedBorder)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .disableAutocorrection(true)

            Button {
                Task { await authViewModel.checkEmail() }
            } label: {
                Text("Continue")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .tint(.appPrimary)
            .disabled(authViewModel.registerEmail.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
    }

    // MARK: - Step 2: Name

    @ViewBuilder
    private func nameStep(auth: AuthViewModel) -> some View {
        VStack(spacing: 16) {
            Text("Welcome! What's your name?")
                .font(.headline)

            TextField("Your name", text: Bindable(auth).registerName)
                .textFieldStyle(.roundedBorder)
                .textContentType(.name)

            Button {
                Task { await authViewModel.register() }
            } label: {
                if authViewModel.isRegistering {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                } else {
                    Text("Create Account")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(.appPrimary)
            .disabled(authViewModel.registerName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || authViewModel.isRegistering)

            Button("Back") {
                authViewModel.resetRegisterFlow()
            }
            .foregroundStyle(.secondary)
        }
    }

    // MARK: - Step 3: Check Email / Demo Verify

    @ViewBuilder
    private var checkEmailStep: some View {
        VStack(spacing: 16) {
            Image(systemName: "envelope.badge.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.appPrimary)

            Text("Check your email!")
                .font(.headline)

            Text("We sent a magic link to **\(authViewModel.registerEmail)**")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            // Demo: Show direct verify button
            if authViewModel.magicLink != nil {
                Divider()
                    .padding(.vertical, 8)

                Text("Demo Mode")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Button {
                    Task { await authViewModel.verifyFromMagicLink() }
                } label: {
                    if authViewModel.isVerifying {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    } else {
                        Text("Verify Now (Demo)")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(.appPrimary)
                .disabled(authViewModel.isVerifying)

                if let verifyError = authViewModel.verifyError {
                    Text(verifyError)
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }

            Button("Start Over") {
                authViewModel.resetRegisterFlow()
            }
            .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    RegisterView()
        .environment(AuthViewModel())
}
