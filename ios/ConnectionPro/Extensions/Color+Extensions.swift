import SwiftUI

extension Color {
    // Primary brand colors
    static let appPrimary = Color(red: 79/255, green: 70/255, blue: 229/255)   // Indigo-600
    static let appSecondary = Color(red: 99/255, green: 102/255, blue: 241/255) // Indigo-500

    // Status colors
    static let statusHealthy = Color.green
    static let statusDueSoon = Color.orange
    static let statusOverdue = Color.red

    // Background colors
    static let cardBackground = Color(.systemBackground)
    static let sectionBackground = Color(.secondarySystemBackground)

    // Gradient for avatars
    static let avatarGradientStart = Color(red: 99/255, green: 102/255, blue: 241/255)
    static let avatarGradientEnd = Color(red: 168/255, green: 85/255, blue: 247/255)
}
