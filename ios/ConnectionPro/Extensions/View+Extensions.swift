import SwiftUI

extension View {
    /// Applies a card-style modifier with rounded corners and shadow.
    func cardStyle() -> some View {
        self
            .padding()
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}
