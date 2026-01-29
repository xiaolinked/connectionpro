import SwiftUI

struct AvatarView: View {
    let name: String
    var size: CGFloat = 44

    private var initial: String {
        String(name.trimmingCharacters(in: .whitespaces).prefix(1)).uppercased()
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [.appPrimary, .appSecondary],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: size, height: size)

            Text(initial)
                .font(.system(size: size * 0.4, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        AvatarView(name: "John Doe", size: 32)
        AvatarView(name: "Alice Smith", size: 44)
        AvatarView(name: "Bob", size: 64)
        AvatarView(name: "", size: 44)
    }
}
