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

                Spacer()
            }

            Text("\(value)")
                .font(.system(size: 32, weight: .bold, design: .rounded))

            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
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
