import SwiftUI

struct ConnectionRowView: View {
    let connection: ConnectionRead

    private var statusResult: ConnectionStatusResult {
        getConnectionStatus(connection)
    }

    private var subtitle: String {
        var parts: [String] = []
        if let role = connection.role, !role.isEmpty {
            parts.append(role)
        }
        if let company = connection.company, !company.isEmpty {
            parts.append(company)
        }
        return parts.joined(separator: " @ ")
    }

    private var lastContactText: String {
        if let date = connection.lastContact {
            return date.relativeString()
        }
        return "Never"
    }

    var body: some View {
        HStack(spacing: 12) {
            AvatarView(name: connection.name, size: 44)

            VStack(alignment: .leading, spacing: 4) {
                Text(connection.name)
                    .font(.headline)

                if !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                StatusBadgeView(status: statusResult.status)

                Text(lastContactText)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    List {
        ConnectionRowView(connection: PreviewData.connection)
        ConnectionRowView(connection: PreviewData.connections[1])
    }
}
