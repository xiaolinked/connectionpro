import SwiftUI

struct SmartRemindersView: View {
    let reminders: [(connection: ConnectionRead, message: String)]

    var body: some View {
        if reminders.isEmpty {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: 12) {
                Label("Smart Reminders", systemImage: "clock.fill")
                    .font(.headline)
                    .foregroundStyle(Color.appPrimary)

                ForEach(reminders, id: \.connection.id) { reminder in
                    NavigationLink(value: reminder.connection) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(reminder.connection.name)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.primary)

                                Text(reminder.message)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding(12)
                        .background(Color.cardBackground.opacity(0.5))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .padding()
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.appPrimary.opacity(0.3), lineWidth: 2)
            )
        }
    }
}

#Preview {
    SmartRemindersView(reminders: [])
        .padding()
}
