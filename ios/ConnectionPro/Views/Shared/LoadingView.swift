import SwiftUI

struct LoadingView: View {
    var message: String? = nil

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
                .tint(.appPrimary)

            if let message = message {
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.sectionBackground)
    }
}

#Preview {
    LoadingView(message: "Loading your network...")
}
