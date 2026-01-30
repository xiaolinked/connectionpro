import SwiftUI

extension Color {
    // Primary brand colors (Kithly)
    // #667eea -> RGB(102, 126, 234)
    static let appPrimary = Color(red: 102/255, green: 126/255, blue: 234/255)
    // #764ba2 -> RGB(118, 75, 162)
    static let appSecondary = Color(red: 118/255, green: 75/255, blue: 162/255)

    // Status colors
    static let statusHealthy = Color.green
    static let statusDueSoon = Color.orange
    static let statusOverdue = Color.red

    // Background colors
    static let cardBackground = Color(.secondarySystemGroupedBackground)
    static let sectionBackground = Color(.systemGroupedBackground)

    // Brand Gradients
    static var brandGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [appPrimary, appSecondary]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // Gradient for avatars
    static let avatarGradientStart = appPrimary
    static let avatarGradientEnd = appSecondary
}
