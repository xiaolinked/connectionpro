import SwiftUI

struct VerifyView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    let token: String

    var body: some View {
        VStack(spacing: 20) {
            if authViewModel.isVerifying {
                ProgressView("Verifying...")
                    .font(.headline)
            } else if let error = authViewModel.verifyError {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(.red)

                Text("Verification Failed")
                    .font(.headline)

                Text(error)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                Button("Try Again") {
                    Task { await authViewModel.verifyToken(token) }
                }
                .buttonStyle(.borderedProminent)
                .tint(.appPrimary)
            } else {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(.green)

                Text("Verified!")
                    .font(.headline)
            }
        }
        .padding()
        .task {
            await authViewModel.verifyToken(token)
        }
    }
}
