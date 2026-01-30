import SwiftUI

struct StatCardView: View {
    let title: String
    let value: Int
    let systemImage: String
    var color: Color = .appPrimary

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: systemImage)
                    .font(.title2)
                    .foregroundStyle(color)
                    .padding(8)
                    .background(color.opacity(0.1))
                    .clipShape(Circle())

                Spacer()
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("\(value)")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)

                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.03), radius: 8, x: 0, y: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.primary.opacity(0.03), lineWidth: 1)
        )
    }
}

#Preview {
    HStack {
        StatCardView(title: "Total Connections", value: 42, systemImage: "person.2.fill", color: .blue)
        StatCardView(title: "Follow-ups", value: 7, systemImage: "calendar", color: .orange)
    }
    .padding()
    .background(Color.sectionBackground)
}
