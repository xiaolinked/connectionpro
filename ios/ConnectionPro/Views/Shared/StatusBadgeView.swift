import SwiftUI

struct StatusBadgeView: View {
    let status: ConnectionStatusType

    private var displayText: String {
        switch status {
        case .healthy:
            return "Healthy"
        case .dueSoon:
            return "Due Soon"
        case .overdue:
            return "Overdue"
        }
    }

    private var backgroundColor: Color {
        switch status {
        case .healthy:
            return .statusHealthy
        case .dueSoon:
            return .statusDueSoon
        case .overdue:
            return .statusOverdue
        }
    }

    var body: some View {
        Text(displayText)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor, in: Capsule())
    }
}

#Preview {
    VStack(spacing: 12) {
        StatusBadgeView(status: .healthy)
        StatusBadgeView(status: .dueSoon)
        StatusBadgeView(status: .overdue)
    }
}
