import SwiftUI

struct TimelineItemView: View {
    let log: LogRead

    private var typeIcon: String {
        switch log.type {
        case "call": return "phone.fill"
        case "email": return "envelope.fill"
        case "meeting": return "person.2.fill"
        case "social": return "bubble.left.fill"
        default: return "text.bubble.fill"
        }
    }

    private var typeColor: Color {
        switch log.type {
        case "call": return .green
        case "email": return .blue
        case "meeting": return .purple
        case "social": return .orange
        default: return .gray
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Type icon
            ZStack {
                Circle()
                    .fill(typeColor.opacity(0.15))
                    .frame(width: 36, height: 36)

                Image(systemName: typeIcon)
                    .font(.system(size: 14))
                    .foregroundStyle(typeColor)
            }

            VStack(alignment: .leading, spacing: 6) {
                // Date and type
                HStack {
                    Text(log.createdAt.relativeString())
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Text("•")
                        .foregroundStyle(.tertiary)
                    Text(log.type.capitalized)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // Notes
                if !log.notes.isEmpty {
                    Text(log.notes)
                        .font(.subheadline)
                }

                // Tags
                if !log.tags.isEmpty {
                    HStack(spacing: 6) {
                        ForEach(log.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.caption2)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color.appPrimary.opacity(0.1))
                                .foregroundStyle(Color.appPrimary)
                                .clipShape(Capsule())
                        }
                    }
                }
            }

            Spacer()
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    VStack {
        TimelineItemView(log: PreviewData.log)
    }
    .padding()
}
